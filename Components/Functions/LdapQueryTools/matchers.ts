// Clause matchers. Each looks for one recognisable phrase inside a clause and
// turns it into a filter node. Pure logic — no browser APIs.

import { CondOp, FilterNode, escapeValue } from './ast';

export type Unit = 'days' | 'weeks' | 'months' | 'years';

const pad = (n: number) => String(n).padStart(2, '0');

// RFC 4517 generalized time. The clock component is zeroed, so an age is
// measured to midnight UTC of the target calendar date.
export function generalizedTime(d: Date): string {
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}000000Z`;
}

// Calendar-aware, so month and year offsets don't drift across leap years.
export function shiftDate(from: Date, amount: number, unit: Unit): Date {
  const d = new Date(from.getTime());
  switch (unit) {
    case 'days': d.setUTCDate(d.getUTCDate() + amount); break;
    case 'weeks': d.setUTCDate(d.getUTCDate() + amount * 7); break;
    case 'months': d.setUTCMonth(d.getUTCMonth() + amount); break;
    case 'years': d.setUTCFullYear(d.getUTCFullYear() + amount); break;
  }
  return d;
}

const readableDate = (d: Date) =>
  `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;

const unitOf = (word: string): Unit => `${word.toLowerCase()}s`.replace(/ss$/, 's') as Unit;

export type MatchResult = {
  start: number;
  end: number;
  node: FilterNode;
  describe: string;
  warning?: string;
  attrs: string[];
};

type Ctx = { now: Date; claimed: Set<string> };

type Matcher = {
  id: string;
  find(text: string, ctx: Ctx): MatchResult | null;
};

// Escape the literal parts of a value but keep any wildcards the user typed.
const wildcardValue = (raw: string) => raw.split('*').map(escapeValue).join('*');

// A captured value may carry its own "or" list, which becomes sibling
// conditions on the same attribute rather than a clause-level disjunction.
function valueNodes(attr: string, raw: string, op: CondOp = '='): FilterNode {
  const values = raw.split(/\s+or\s+/i).map(v => v.trim()).filter(Boolean);
  const conds: FilterNode[] = values.map(value => ({ type: 'cond', attr, op, value }));
  return conds.length === 1 ? conds[0] : { type: 'or', children: conds };
}

const quoted = (m: RegExpMatchArray, ...groups: number[]) =>
  groups.map(g => m[g]).find(v => v !== undefined) ?? '';

function simple(
  id: string,
  re: RegExp,
  attrs: string[],
  build: (m: RegExpMatchArray, ctx: Ctx) => { node: FilterNode; describe: string; warning?: string },
): Matcher {
  return {
    id,
    find(text, ctx) {
      const m = text.match(re);
      if (!m || m.index === undefined) return null;
      return { start: m.index, end: m.index + m[0].length, attrs, ...build(m, ctx) };
    },
  };
}

const OBJECT_CLASSES: Array<[RegExp, string]> = [
  [/\b(?:groups?|teams?)\b/i, 'group'],
  [/\b(?:computers?|machines?|workstations?|servers?)\b/i, 'computer'],
  // "account(s)" is deliberately absent — it is a stopword, so that
  // "accounts older than 3 years" does not emit a second objectClass conjunct.
  [/\b(?:users?|people|persons?)\b/i, 'user'],
];

const objectClassMatcher: Matcher = {
  id: 'objectClass',
  find(text) {
    for (const [re, cls] of OBJECT_CLASSES) {
      const m = text.match(re);
      if (m && m.index !== undefined) {
        return {
          start: m.index,
          end: m.index + m[0].length,
          attrs: ['objectClass'],
          node: { type: 'cond', attr: 'objectClass', op: '=', value: cls },
          describe: `Targeting ${cls} objects (objectClass=${cls})`,
        };
      }
    }
    return null;
  },
};

const departmentMatcher: Matcher = {
  id: 'department',
  find(text) {
    const patterns = [
      /\b(?:in|from|of)\s+(?:the\s+)?(.+?)\s+departments?\b/i,
      /(?:^|\s)(?:the\s+)?(\S.*?)\s+departments?\b/i,
    ];
    for (const re of patterns) {
      const m = text.match(re);
      if (m && m.index !== undefined) {
        const value = m[1].trim();
        return {
          start: m.index,
          end: m.index + m[0].length,
          attrs: ['department'],
          node: valueNodes('department', value),
          describe: `Department is ${value.split(/\s+or\s+/i).map(v => `"${v.trim()}"`).join(' or ')}`,
        };
      }
    }
    return null;
  },
};

const PRESENCE_ATTRS: Array<[RegExp, string, string]> = [
  [/\b(?:phones?|telephones?|mobiles?)\b/i, 'telephoneNumber', 'a telephone number'],
  [/\b(?:e-?mails?|mail)\b/i, 'mail', 'an email address'],
];

function presenceMatcher(id: string, negated: boolean): Matcher {
  return {
    id,
    find(text, ctx) {
      for (const [re, attr, label] of PRESENCE_ATTRS) {
        // Another matcher already constrained this attribute, so a bare
        // presence test would only add a redundant conjunct.
        if (ctx.claimed.has(attr)) continue;
        const full = negated ? new RegExp(`\\bno\\s+${re.source.replace(/^\\b|\\b$/g, '')}`, 'i') : re;
        const m = text.match(full);
        if (m && m.index !== undefined) {
          const cond: FilterNode = { type: 'cond', attr, op: '=', value: '*', raw: true };
          return {
            start: m.index,
            end: m.index + m[0].length,
            attrs: [attr],
            node: negated ? { type: 'not', child: cond } : cond,
            describe: negated ? `Has no ${label} set` : `Has ${label} set`,
          };
        }
      }
      return null;
    },
  };
}

// Extensible match (bitwise AND). The trailing colon belongs to the rule
// syntax — the filter reads `attr:OID:=value`.
const UAC_DISABLED = 'userAccountControl:1.2.840.113556.1.4.803:';

// Order is significant: earlier matchers consume their span before later ones
// see the clause. Specific phrasings must precede general ones.
const REGISTRY: Matcher[] = [
  objectClassMatcher,

  simple('age-older', /\bolder\s+than\s+(\d+)\s+(day|week|month|year)s?\b/i, ['whenCreated'], (m, ctx) => {
    const at = shiftDate(ctx.now, -Number(m[1]), unitOf(m[2]));
    return {
      node: { type: 'cond', attr: 'whenCreated', op: '<=', value: generalizedTime(at), raw: true },
      describe: `Account created on or before ${readableDate(at)} (older than ${m[1]} ${m[2]}s)`,
    };
  }),

  simple('age-newer', /\bnewer\s+than\s+(\d+)\s+(day|week|month|year)s?\b/i, ['whenCreated'], (m, ctx) => {
    const at = shiftDate(ctx.now, -Number(m[1]), unitOf(m[2]));
    return {
      node: { type: 'cond', attr: 'whenCreated', op: '>=', value: generalizedTime(at), raw: true },
      describe: `Account created on or after ${readableDate(at)} (newer than ${m[1]} ${m[2]}s)`,
    };
  }),

  simple('modified', /\bmodified\s+(?:in\s+the\s+)?last\s+(\d+)\s+(day|week|month|year)s?\b/i, ['whenChanged'], (m, ctx) => {
    const at = shiftDate(ctx.now, -Number(m[1]), unitOf(m[2]));
    return {
      node: { type: 'cond', attr: 'whenChanged', op: '>=', value: generalizedTime(at), raw: true },
      describe: `Modified on or after ${readableDate(at)}`,
    };
  }),

  simple('memberOf', /\bmembers?\s+of\s+(?:"([^"]+)"|'([^']+)'|([A-Za-z][\w\s-]*?))(?=\s*$|,)/i, ['memberOf'], m => {
    const group = quoted(m, 1, 2, 3).trim();
    return {
      node: {
        type: 'cond',
        attr: 'memberOf',
        op: '=',
        value: `CN=${escapeValue(group)},DC=example,DC=com`,
        raw: true,
      },
      describe: `Member of group "${group}" (adjust DN as needed)`,
      warning: 'DN for memberOf is a placeholder — update DC components for your domain.',
    };
  }),

  departmentMatcher,

  simple('title', /\b(?:job\s+)?titles?d?\s+(?:"([^"]+)"|'([^']+)'|(\S.*?))(?=\s*$|,)/i, ['title'], m => {
    const value = quoted(m, 1, 2, 3).trim();
    return {
      node: valueNodes('title', value),
      describe: `Job title is ${value.split(/\s+or\s+/i).map(v => `"${v.trim()}"`).join(' or ')}`,
    };
  }),

  simple('cn', /\b(?:named|called)\s+(?:"([^"]+)"|'([^']+)'|([A-Za-z][\w*'-]*(?:\s+[A-Za-z][\w*'-]*)*))/i, ['cn'], m => {
    const raw = quoted(m, 1, 2, 3).trim();
    const escaped = wildcardValue(raw);
    const value = escaped.endsWith('*') ? escaped : `${escaped}*`;
    return {
      node: { type: 'cond', attr: 'cn', op: '=', value, raw: true },
      describe: `Name starts with "${raw}" (cn=${value})`,
    };
  }),

  simple('mail', /@([\w.-]+\.[a-z]{2,})\b/i, ['mail'], m => ({
    node: { type: 'cond', attr: 'mail', op: '=', value: `*@${escapeValue(m[1])}`, raw: true },
    describe: `Email domain is ${m[1]}`,
  })),

  simple('disabled', /\b(?:disabled|inactive)\b/i, ['userAccountControl'], () => ({
    node: { type: 'cond', attr: UAC_DISABLED, op: '=', value: '2', raw: true },
    describe: 'Account is disabled (userAccountControl bit 2 set)',
  })),

  simple('enabled', /\b(?:active|enabled)\b/i, ['userAccountControl'], () => ({
    node: { type: 'not', child: { type: 'cond', attr: UAC_DISABLED, op: '=', value: '2', raw: true } },
    describe: 'Account is enabled (not disabled via userAccountControl)',
  })),

  presenceMatcher('absence', true),
  presenceMatcher('presence', false),
];

const blank = (s: string, start: number, end: number) =>
  s.slice(0, start) + ' '.repeat(end - start) + s.slice(end);

export type RunResult = {
  nodes: FilterNode[];
  explanations: string[];
  warnings: string[];
  leftover: string;
};

// Runs every matcher over the clause. Each match blanks the span it consumed,
// so later matchers only see text nothing has claimed yet, and whatever is
// left at the end is text the tool did not understand.
export function runMatchers(clause: string, now: Date): RunResult {
  let remaining = clause;
  const nodes: FilterNode[] = [];
  const explanations: string[] = [];
  const warnings: string[] = [];
  const claimed = new Set<string>();

  for (const matcher of REGISTRY) {
    const result = matcher.find(remaining, { now, claimed });
    if (!result) continue;
    nodes.push(result.node);
    explanations.push(result.describe);
    if (result.warning) warnings.push(result.warning);
    result.attrs.forEach(a => claimed.add(a));
    remaining = blank(remaining, result.start, result.end);
  }

  return { nodes, explanations, warnings, leftover: remaining };
}
