// SQL Query Analyzer — pure TypeScript, no browser APIs
// Analyzes SQL structure and explains each clause

export interface SqlClause {
  name: string;
  content: string;
  explanation: string;
}

export interface SqlAnalysis {
  statementType: string;
  clauses: SqlClause[];
  tables: string[];
  columns: string[];
  conditions: string[];
  aggregates: string[];
  joins: string[];
  warnings: string[];
  summary: string;
  formattedSql: string;
}

const SQL_KEYWORDS = [
  'SELECT', 'DISTINCT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'IN', 'EXISTS',
  'BETWEEN', 'LIKE', 'IS', 'NULL', 'AS', 'ON', 'JOIN', 'INNER', 'LEFT', 'RIGHT',
  'FULL', 'OUTER', 'CROSS', 'NATURAL', 'UNION', 'ALL', 'INTERSECT', 'EXCEPT',
  'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE', 'TABLE',
  'ALTER', 'DROP', 'TRUNCATE', 'INDEX', 'VIEW', 'DATABASE', 'SCHEMA',
  'GROUP', 'BY', 'HAVING', 'ORDER', 'ASC', 'DESC', 'LIMIT', 'OFFSET',
  'WITH', 'RECURSIVE', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
  'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'UNIQUE', 'CHECK', 'DEFAULT',
  'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'COALESCE', 'NULLIF', 'CAST',
];

function upperKeywords(sql: string): string {
  let result = sql;
  for (const kw of SQL_KEYWORDS) {
    const re = new RegExp('\\b' + kw + '\\b', 'gi');
    result = result.replace(re, kw);
  }
  return result;
}

function formatSql(sql: string): string {
  const normalized = upperKeywords(sql.replace(/\s+/g, ' ').trim());

  const breakBefore = [
    'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'OFFSET',
    'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN', 'CROSS JOIN', 'JOIN',
    'UNION', 'UNION ALL', 'INTERSECT', 'EXCEPT',
    'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM',
    'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE',
  ];

  let out = normalized;
  for (const token of breakBefore) {
    const re = new RegExp('\\b(' + token.replace(/\s/g, '\\s+') + ')\\b', 'g');
    out = out.replace(re, '\n$1');
  }

  // Indent AND / OR inside WHERE
  out = out.replace(/\n(AND|OR)\b/g, '\n  $1');

  return out.split('\n').map(l => l.trimEnd()).filter(l => l.length > 0).join('\n');
}

function detectStatementType(sql: string): string {
  const upper = sql.trim().toUpperCase();
  if (upper.startsWith('SELECT') || upper.startsWith('WITH')) return 'SELECT';
  if (upper.startsWith('INSERT')) return 'INSERT';
  if (upper.startsWith('UPDATE')) return 'UPDATE';
  if (upper.startsWith('DELETE')) return 'DELETE';
  if (upper.startsWith('CREATE')) return 'CREATE';
  if (upper.startsWith('ALTER')) return 'ALTER';
  if (upper.startsWith('DROP')) return 'DROP';
  if (upper.startsWith('TRUNCATE')) return 'TRUNCATE';
  return 'UNKNOWN';
}

function extractTables(sql: string): string[] {
  const tables: string[] = [];
  const upper = sql.toUpperCase();

  // FROM clause
  const fromMatch = upper.match(/\bFROM\s+([\w.,\s`"[\]]+?)(?:\s+WHERE|\s+JOIN|\s+GROUP|\s+ORDER|\s+LIMIT|\s+HAVING|$)/);
  if (fromMatch) {
    const raw = fromMatch[1];
    raw.split(',').forEach(t => {
      const name = t.trim().split(/\s+/)[0].replace(/[`"[\]]/g, '');
      if (name && !tables.includes(name)) tables.push(name);
    });
  }

  // JOIN clauses
  const joinRe = /\bJOIN\s+([\w`"[\]]+)/gi;
  let m: RegExpExecArray | null;
  while ((m = joinRe.exec(sql)) !== null) {
    const name = m[1].replace(/[`"[\]]/g, '');
    if (name && !tables.includes(name.toUpperCase())) tables.push(name.toUpperCase());
  }

  // INSERT INTO / UPDATE
  const intoMatch = sql.toUpperCase().match(/(?:INSERT\s+INTO|UPDATE)\s+([\w`"[\]]+)/);
  if (intoMatch) {
    const name = intoMatch[1].replace(/[`"[\]]/g, '');
    if (name && !tables.includes(name)) tables.push(name);
  }

  return tables;
}

function extractColumns(sql: string): string[] {
  const upper = sql.toUpperCase();
  const selectMatch = upper.match(/^SELECT\s+(.+?)\s+FROM\b/s);
  if (!selectMatch) return [];

  const colsPart = selectMatch[1];
  if (colsPart.trim() === '*') return ['* (all columns)'];

  const cols: string[] = [];
  let depth = 0;
  let current = '';
  for (let i = 0; i < colsPart.length; i++) {
    const ch = colsPart[i];
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    else if (ch === ',' && depth === 0) {
      cols.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  if (current.trim()) cols.push(current.trim());

  return cols.map(c => {
    const alias = c.match(/\bAS\s+(\w+)$/i);
    if (alias) return c.slice(0, c.lastIndexOf(alias[0])).trim() + ' → ' + alias[1];
    return c;
  }).slice(0, 10);
}

function extractAggregates(sql: string): string[] {
  const aggRe = /\b(COUNT|SUM|AVG|MIN|MAX)\s*\(([^)]*)\)/gi;
  const found: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = aggRe.exec(sql)) !== null) {
    found.push(m[0].replace(/\s+/g, ' '));
  }
  return found;
}

function extractJoins(sql: string): string[] {
  const joinRe = /\b((?:INNER|LEFT|RIGHT|FULL|CROSS|NATURAL)?\s*(?:OUTER\s+)?JOIN)\s+([\w`"[\].]+)(?:\s+(?:AS\s+)?\w+)?\s+ON\s+([^JOIN\n]+)/gi;
  const found: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = joinRe.exec(sql)) !== null) {
    found.push((m[1].trim() || 'JOIN') + ' ' + m[2].trim() + ' ON ' + m[3].trim().replace(/\s+/g, ' '));
  }
  return found;
}

function extractConditions(sql: string): string[] {
  const whereMatch = sql.match(/\bWHERE\s+(.+?)(?:\s+GROUP\s+BY|\s+ORDER\s+BY|\s+HAVING|\s+LIMIT|$)/si);
  if (!whereMatch) return [];
  const cond = whereMatch[1].trim();
  // Split on AND/OR at top level
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  const upper = cond.toUpperCase();
  let i = 0;
  while (i < cond.length) {
    if (cond[i] === '(') depth++;
    else if (cond[i] === ')') depth--;
    else if (depth === 0) {
      if (upper.startsWith('AND ', i) || upper.startsWith('OR ', i)) {
        const sep = upper.startsWith('AND ', i) ? 'AND' : 'OR';
        if (current.trim()) parts.push(current.trim());
        current = sep + ' ';
        i += sep.length + 1;
        continue;
      }
    }
    current += cond[i];
    i++;
  }
  if (current.trim()) parts.push(current.trim());
  return parts.filter(p => p.length > 0);
}

function buildClauses(sql: string, type: string): SqlClause[] {
  const clauses: SqlClause[] = [];
  const upper = sql.toUpperCase();

  if (type === 'SELECT') {
    const selectMatch = sql.match(/SELECT\s+(.+?)\s+FROM\b/si);
    if (selectMatch) {
      const distinct = /\bDISTINCT\b/i.test(selectMatch[1]);
      clauses.push({
        name: 'SELECT',
        content: selectMatch[1].replace(/\s+/g, ' ').trim(),
        explanation: distinct
          ? 'Returns unique rows only — eliminates duplicate result rows.'
          : 'Specifies which columns or expressions to include in the result set.',
      });
    }

    const fromMatch = sql.match(/\bFROM\s+(.+?)(?:\s+WHERE|\s+JOIN|\s+GROUP|\s+ORDER|\s+LIMIT|\s+HAVING|$)/si);
    if (fromMatch) {
      clauses.push({
        name: 'FROM',
        content: fromMatch[1].replace(/\s+/g, ' ').trim(),
        explanation: 'Identifies the source table(s) to query. Multiple tables separated by commas create a Cartesian product.',
      });
    }

    const joins = extractJoins(sql);
    for (const j of joins) {
      const jType = j.split(' ')[0];
      const desc: Record<string, string> = {
        INNER: 'Returns only rows that match in both tables.',
        LEFT: 'Returns all rows from the left table, with NULLs for non-matching right table rows.',
        RIGHT: 'Returns all rows from the right table, with NULLs for non-matching left table rows.',
        FULL: 'Returns all rows from both tables, NULLs where no match.',
        CROSS: 'Produces a Cartesian product of both tables — every row combined with every other.',
        NATURAL: 'Automatically joins on columns with the same name in both tables.',
      };
      clauses.push({
        name: jType + ' JOIN',
        content: j,
        explanation: desc[jType] || 'Combines rows from two tables based on a related column.',
      });
    }

    const conds = extractConditions(sql);
    if (conds.length > 0) {
      clauses.push({
        name: 'WHERE',
        content: conds.join('\n'),
        explanation: 'Filters rows before aggregation. Only rows satisfying all conditions are included.',
      });
    }

    if (/\bGROUP\s+BY\b/i.test(sql)) {
      const gbMatch = sql.match(/\bGROUP\s+BY\s+(.+?)(?:\s+HAVING|\s+ORDER|\s+LIMIT|$)/si);
      clauses.push({
        name: 'GROUP BY',
        content: gbMatch ? gbMatch[1].replace(/\s+/g, ' ').trim() : '',
        explanation: 'Collapses rows with the same values in the specified columns into summary rows, enabling aggregate functions.',
      });
    }

    if (/\bHAVING\b/i.test(sql)) {
      const havMatch = sql.match(/\bHAVING\s+(.+?)(?:\s+ORDER|\s+LIMIT|$)/si);
      clauses.push({
        name: 'HAVING',
        content: havMatch ? havMatch[1].replace(/\s+/g, ' ').trim() : '',
        explanation: 'Filters groups after aggregation (like WHERE but for GROUP BY results).',
      });
    }

    if (/\bORDER\s+BY\b/i.test(sql)) {
      const obMatch = sql.match(/\bORDER\s+BY\s+(.+?)(?:\s+LIMIT|$)/si);
      clauses.push({
        name: 'ORDER BY',
        content: obMatch ? obMatch[1].replace(/\s+/g, ' ').trim() : '',
        explanation: 'Sorts the final result set. ASC is ascending (default), DESC is descending.',
      });
    }

    if (/\bLIMIT\b/i.test(upper)) {
      const limMatch = sql.match(/\bLIMIT\s+(\d+)(?:\s+OFFSET\s+(\d+))?/si);
      if (limMatch) {
        clauses.push({
          name: 'LIMIT',
          content: limMatch[0],
          explanation: limMatch[2]
            ? `Returns at most ${limMatch[1]} rows, starting from row ${limMatch[2]} (0-indexed).`
            : `Caps the result at ${limMatch[1]} rows — useful for pagination.`,
        });
      }
    }
  } else if (type === 'INSERT') {
    const intoMatch = sql.match(/INSERT\s+INTO\s+([\w`"[\].]+)\s*(\([^)]*\))?/si);
    if (intoMatch) {
      clauses.push({
        name: 'INSERT INTO',
        content: intoMatch[0].replace(/\s+/g, ' ').trim(),
        explanation: intoMatch[2]
          ? 'Inserts a new row specifying which columns receive values.'
          : 'Inserts a new row — values must match the table column order.',
      });
    }
    const valMatch = sql.match(/\bVALUES\s*\((.+?)\)/si);
    if (valMatch) {
      clauses.push({
        name: 'VALUES',
        content: valMatch[0].replace(/\s+/g, ' ').trim(),
        explanation: 'The data to insert into the row.',
      });
    }
  } else if (type === 'UPDATE') {
    const updateMatch = sql.match(/UPDATE\s+([\w`"[\].]+)/si);
    if (updateMatch) {
      clauses.push({
        name: 'UPDATE',
        content: updateMatch[1],
        explanation: 'Modifies existing rows in the specified table.',
      });
    }
    const setMatch = sql.match(/\bSET\s+(.+?)(?:\s+WHERE|$)/si);
    if (setMatch) {
      clauses.push({
        name: 'SET',
        content: setMatch[1].replace(/\s+/g, ' ').trim(),
        explanation: 'Specifies column = value assignments to apply to matching rows.',
      });
    }
    const conds = extractConditions(sql);
    if (conds.length > 0) {
      clauses.push({
        name: 'WHERE',
        content: conds.join('\n'),
        explanation: 'Without WHERE, ALL rows would be updated. Always double-check this clause.',
      });
    }
  } else if (type === 'DELETE') {
    const fromMatch = sql.match(/DELETE\s+FROM\s+([\w`"[\].]+)/si);
    if (fromMatch) {
      clauses.push({
        name: 'DELETE FROM',
        content: fromMatch[1],
        explanation: 'Removes rows from the specified table.',
      });
    }
    const conds = extractConditions(sql);
    if (conds.length > 0) {
      clauses.push({
        name: 'WHERE',
        content: conds.join('\n'),
        explanation: 'Without WHERE, ALL rows in the table would be deleted!',
      });
    }
  }

  return clauses;
}

function buildWarnings(sql: string, type: string): string[] {
  const warnings: string[] = [];
  const upper = sql.toUpperCase();

  if ((type === 'UPDATE' || type === 'DELETE') && !/\bWHERE\b/.test(upper)) {
    warnings.push('No WHERE clause — this will affect ALL rows in the table!');
  }
  if (/SELECT\s+\*/i.test(sql)) {
    warnings.push('SELECT * — selecting all columns may return unnecessary data and is slower than selecting specific columns.');
  }
  if (/\bLIKE\s+'%[^%]/i.test(sql)) {
    warnings.push('LIKE with a leading wildcard (e.g. LIKE \'%value\') cannot use an index and requires a full table scan.');
  }
  if ((upper.match(/\bJOIN\b/g) || []).length > 3) {
    warnings.push('Query has more than 3 JOINs — consider reviewing the data model or breaking into smaller queries.');
  }
  if (/\bSELECT\b.+\bSELECT\b/is.test(sql)) {
    warnings.push('Subquery detected — ensure it can be rewritten as a JOIN for better performance.');
  }
  if (/\bDROP\b/i.test(sql)) {
    warnings.push('DROP statement — this operation is irreversible. Make sure you have a backup.');
  }
  if (/\bTRUNCATE\b/i.test(sql)) {
    warnings.push('TRUNCATE removes all rows quickly and cannot be rolled back in some databases.');
  }

  return warnings;
}

export interface SqlIssue {
  severity: 'high' | 'medium' | 'low';
  title: string;
  detail: string;
}

/**
 * The same checks `buildWarnings` runs, but graded and split into a headline and an
 * explanation so the UI can rank them. The string list stays for anyone reading the
 * plain text output.
 */
export function auditSql(input: string): SqlIssue[] {
  const sql = input.trim();
  if (!sql) return [];
  const type = detectStatementType(sql);
  const upper = sql.toUpperCase();
  const issues: SqlIssue[] = [];

  if ((type === 'UPDATE' || type === 'DELETE') && !/\bWHERE\b/.test(upper)) {
    issues.push({
      severity: 'high',
      title: `${type} without WHERE`,
      detail: 'Every row in the table is affected. Run it as a SELECT first to see what you are about to change.',
    });
  }
  if (/\bDROP\b/i.test(sql)) {
    issues.push({
      severity: 'high',
      title: 'DROP statement',
      detail: 'Irreversible — the object and its data go away. Confirm you have a backup.',
    });
  }
  if (/\bTRUNCATE\b/i.test(sql)) {
    issues.push({
      severity: 'high',
      title: 'TRUNCATE statement',
      detail: 'Empties the table without logging individual rows, and on several engines it cannot be rolled back.',
    });
  }
  if (/\bLIKE\s+'%[^%]/i.test(sql)) {
    issues.push({
      severity: 'medium',
      title: "LIKE with a leading wildcard",
      detail: "A pattern starting with % cannot use a B-tree index, so the engine scans the whole table. Full-text search or a reversed-string index are the usual answers.",
    });
  }
  if (/\bSELECT\b.+\bSELECT\b/is.test(sql)) {
    issues.push({
      severity: 'medium',
      title: 'Subquery present',
      detail: 'Correlated subqueries run once per outer row. Check whether a JOIN or a lateral join expresses the same thing.',
    });
  }
  if ((upper.match(/\bJOIN\b/g) || []).length > 3) {
    issues.push({
      severity: 'medium',
      title: 'More than three JOINs',
      detail: 'Join order search space grows fast, and planners start guessing. Consider splitting the query or denormalising.',
    });
  }
  if (/SELECT\s+\*/i.test(sql)) {
    issues.push({
      severity: 'low',
      title: 'SELECT *',
      detail: 'Pulls every column over the wire and prevents covering-index-only scans. Name the columns you use.',
    });
  }
  if (type === 'SELECT' && /\bORDER\s+BY\b/i.test(sql) && !/\bLIMIT\b/i.test(sql)) {
    issues.push({
      severity: 'low',
      title: 'ORDER BY without LIMIT',
      detail: 'The whole result set gets sorted. If you only need the top rows, say so and the engine can stop early.',
    });
  }

  return issues;
}

export type SqlTokenKind =
  | 'keyword'
  | 'function'
  | 'string'
  | 'number'
  | 'comment'
  | 'operator'
  | 'punctuation'
  | 'identifier'
  | 'whitespace';

export interface SqlToken {
  text: string;
  kind: SqlTokenKind;
}

const FUNCTION_NAMES = ['COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'COALESCE', 'NULLIF', 'CAST', 'NOW', 'DATE', 'ROUND', 'CONCAT', 'LENGTH', 'UPPER', 'LOWER'];

/**
 * Enough of a lexer to colour a query. Strings and comments are consumed whole so a
 * keyword inside a literal is never highlighted.
 */
export function tokenizeSql(sql: string): SqlToken[] {
  const tokens: SqlToken[] = [];
  let i = 0;

  const push = (text: string, kind: SqlTokenKind) => {
    if (text) tokens.push({ text, kind });
  };

  while (i < sql.length) {
    const ch = sql[i];

    if (/\s/.test(ch)) {
      let j = i;
      while (j < sql.length && /\s/.test(sql[j])) j++;
      push(sql.slice(i, j), 'whitespace');
      i = j;
      continue;
    }

    if (ch === '-' && sql[i + 1] === '-') {
      const end = sql.indexOf('\n', i);
      const stop = end === -1 ? sql.length : end;
      push(sql.slice(i, stop), 'comment');
      i = stop;
      continue;
    }

    if (ch === '/' && sql[i + 1] === '*') {
      const end = sql.indexOf('*/', i + 2);
      const stop = end === -1 ? sql.length : end + 2;
      push(sql.slice(i, stop), 'comment');
      i = stop;
      continue;
    }

    if (ch === "'" || ch === '"' || ch === '`') {
      let j = i + 1;
      while (j < sql.length && sql[j] !== ch) {
        if (sql[j] === '\\') j++;
        j++;
      }
      push(sql.slice(i, Math.min(j + 1, sql.length)), ch === "'" ? 'string' : 'identifier');
      i = j + 1;
      continue;
    }

    if (/\d/.test(ch)) {
      let j = i;
      while (j < sql.length && /[\d.]/.test(sql[j])) j++;
      push(sql.slice(i, j), 'number');
      i = j;
      continue;
    }

    if (/[\w$]/.test(ch)) {
      let j = i;
      while (j < sql.length && /[\w$.]/.test(sql[j])) j++;
      const word = sql.slice(i, j);
      const upper = word.toUpperCase();
      const followedByParen = /^\s*\(/.test(sql.slice(j));
      if (FUNCTION_NAMES.includes(upper) && followedByParen) push(word, 'function');
      else if (SQL_KEYWORDS.includes(upper)) push(word, 'keyword');
      else push(word, 'identifier');
      i = j;
      continue;
    }

    if ('=<>!+-*/%|&'.includes(ch)) {
      let j = i;
      while (j < sql.length && '=<>!+-*/%|&'.includes(sql[j])) j++;
      push(sql.slice(i, j), 'operator');
      i = j;
      continue;
    }

    push(ch, 'punctuation');
    i++;
  }

  return tokens;
}

export function analyzeSql(input: string): SqlAnalysis {
  const sql = input.trim();
  if (!sql) {
    return {
      statementType: '',
      clauses: [],
      tables: [],
      columns: [],
      conditions: [],
      aggregates: [],
      joins: [],
      warnings: [],
      summary: '',
      formattedSql: '',
    };
  }

  const type = detectStatementType(sql);
  const tables = extractTables(sql);
  const columns = type === 'SELECT' ? extractColumns(sql) : [];
  const conditions = extractConditions(sql);
  const aggregates = extractAggregates(sql);
  const joins = extractJoins(sql);
  const clauses = buildClauses(sql, type);
  const warnings = buildWarnings(sql, type);
  const formattedSql = formatSql(sql);

  const joinCount = joins.length;
  const aggCount = aggregates.length;

  let summary = type + ' statement';
  if (tables.length > 0) summary += ' on ' + tables.join(', ');
  if (joinCount > 0) summary += ` with ${joinCount} JOIN${joinCount > 1 ? 's' : ''}`;
  if (aggCount > 0) summary += `, ${aggCount} aggregate${aggCount > 1 ? 's' : ''}`;
  if (conditions.length > 0) summary += `, ${conditions.length} condition${conditions.length > 1 ? 's' : ''}`;

  return { statementType: type, clauses, tables, columns, conditions, aggregates, joins, warnings, summary, formattedSql };
}
