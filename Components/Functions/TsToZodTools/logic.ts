// All functions in this file are pure (no React, no browser APIs).

// ─── Tokenizer ────────────────────────────────────────────────────────────────

type Token = { type: string; value: string };

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const src = input.trim();

  while (i < src.length) {
    // Skip whitespace
    if (/\s/.test(src[i])) { i++; continue; }

    // Skip line comments
    if (src[i] === '/' && src[i + 1] === '/') {
      while (i < src.length && src[i] !== '\n') i++;
      continue;
    }
    // Skip block comments
    if (src[i] === '/' && src[i + 1] === '*') {
      i += 2;
      while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) i++;
      i += 2;
      continue;
    }

    // String literals (for enum values)
    if (src[i] === '"' || src[i] === "'") {
      const quote = src[i];
      let str = '';
      i++;
      while (i < src.length && src[i] !== quote) {
        if (src[i] === '\\') { i++; }
        str += src[i++];
      }
      i++; // closing quote
      tokens.push({ type: 'string', value: str });
      continue;
    }

    // Punctuation
    if ('{}[]();,|&?='.includes(src[i])) {
      tokens.push({ type: 'punct', value: src[i] });
      i++;
      continue;
    }

    // Identifiers / keywords
    if (/[a-zA-Z_$]/.test(src[i])) {
      let word = '';
      while (i < src.length && /[a-zA-Z0-9_$]/.test(src[i])) word += src[i++];
      tokens.push({ type: 'ident', value: word });
      continue;
    }

    // Numbers
    if (/\d/.test(src[i])) {
      let num = '';
      while (i < src.length && /[\d.]/.test(src[i])) num += src[i++];
      tokens.push({ type: 'number', value: num });
      continue;
    }

    // Colons (field separator)
    if (src[i] === ':') {
      tokens.push({ type: 'colon', value: ':' });
      i++;
      continue;
    }

    i++;
  }

  return tokens;
}

// ─── Parser ───────────────────────────────────────────────────────────────────

type TsType =
  | { kind: 'primitive'; name: 'string' | 'number' | 'boolean' | 'null' | 'undefined' | 'any' | 'unknown' | 'never' | 'void' }
  | { kind: 'array'; item: TsType }
  | { kind: 'object'; fields: TsField[] }
  | { kind: 'union'; members: TsType[] }
  | { kind: 'literal'; value: string }
  | { kind: 'ref'; name: string };

type TsField = {
  name: string;
  optional: boolean;
  type: TsType;
};

type TsDecl = {
  kind: 'interface' | 'type';
  name: string;
  fields?: TsField[];
  typeAlias?: TsType;
};

class Parser {
  private tokens: Token[];
  private pos: number;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
    this.pos = 0;
  }

  private peek(offset = 0): Token | undefined {
    return this.tokens[this.pos + offset];
  }

  private consume(): Token {
    return this.tokens[this.pos++];
  }

  private expect(type: string, value?: string): Token {
    const t = this.consume();
    if (!t) throw new Error(`Expected ${type} but got end of input`);
    if (t.type !== type && (value === undefined || t.value !== value)) {
      // lenient
    }
    return t;
  }

  private skipUntil(value: string): void {
    while (this.pos < this.tokens.length && this.tokens[this.pos].value !== value) {
      this.pos++;
    }
  }

  parseAll(): TsDecl[] {
    const decls: TsDecl[] = [];
    while (this.pos < this.tokens.length) {
      const t = this.peek();
      if (!t) break;

      // skip export/declare
      if (t.type === 'ident' && (t.value === 'export' || t.value === 'declare')) {
        this.consume();
        continue;
      }

      if (t.type === 'ident' && t.value === 'interface') {
        const d = this.parseInterface();
        if (d) decls.push(d);
      } else if (t.type === 'ident' && t.value === 'type') {
        const d = this.parseTypeAlias();
        if (d) decls.push(d);
      } else if (t.type === 'ident' && t.value === 'enum') {
        const d = this.parseEnum();
        if (d) decls.push(d);
      } else {
        this.consume(); // skip unknown tokens
      }
    }
    return decls;
  }

  private parseInterface(): TsDecl | null {
    this.consume(); // 'interface'
    const nameToken = this.consume();
    if (!nameToken) return null;
    const name = nameToken.value;

    // Skip extends clause
    if (this.peek() && this.peek()!.value === 'extends') {
      this.consume();
      while (this.pos < this.tokens.length && this.peek()!.value !== '{') {
        this.consume();
      }
    }

    if (!this.peek() || this.peek()!.value !== '{') return null;
    this.consume(); // '{'

    const fields = this.parseFields();
    return { kind: 'interface', name, fields };
  }

  private parseTypeAlias(): TsDecl | null {
    this.consume(); // 'type'
    const nameToken = this.consume();
    if (!nameToken) return null;
    const name = nameToken.value;

    // Skip generics
    if (this.peek() && this.peek()!.value === '<') {
      let depth = 1;
      this.consume();
      while (this.pos < this.tokens.length && depth > 0) {
        const t = this.consume();
        if (t.value === '<') depth++;
        else if (t.value === '>') depth--;
      }
    }

    // Expect '='
    if (!this.peek() || this.peek()!.value !== '=') {
      this.skipUntil(';');
      this.pos++;
      return null;
    }
    this.consume(); // '='

    const type = this.parseType();
    return { kind: 'type', name, typeAlias: type };
  }

  private parseEnum(): TsDecl | null {
    this.consume(); // 'enum'
    const nameToken = this.consume();
    if (!nameToken) return null;
    const name = nameToken.value;

    if (!this.peek() || this.peek()!.value !== '{') return null;
    this.consume(); // '{'

    const members: string[] = [];
    while (this.pos < this.tokens.length && this.peek()!.value !== '}') {
      const t = this.peek();
      if (!t) break;
      if (t.type === 'ident') {
        this.consume();
        // If '= value'
        if (this.peek() && this.peek()!.value === '=') {
          this.consume(); // '='
          const val = this.consume();
          members.push(val.value);
        } else {
          members.push(t.value);
        }
        if (this.peek() && this.peek()!.value === ',') this.consume();
      } else if (t.type === 'string') {
        members.push(t.value);
        this.consume();
        if (this.peek() && this.peek()!.value === ',') this.consume();
      } else {
        this.consume();
      }
    }
    if (this.peek()) this.consume(); // '}'

    const unionType: TsType = {
      kind: 'union',
      members: members.map(m => ({ kind: 'literal', value: m } as TsType)),
    };
    return { kind: 'type', name, typeAlias: unionType };
  }

  private parseFields(): TsField[] {
    const fields: TsField[] = [];
    while (this.pos < this.tokens.length) {
      const t = this.peek();
      if (!t || t.value === '}') {
        if (t) this.consume(); // '}'
        break;
      }
      if (t.value === ';' || t.value === ',') { this.consume(); continue; }
      if (t.type === 'punct' && (t.value === '[' || t.value === '(')) {
        // Index signature or method — skip
        let depth = 1;
        this.consume();
        while (this.pos < this.tokens.length && depth > 0) {
          const x = this.consume();
          if (x.value === '[' || x.value === '(') depth++;
          else if (x.value === ']' || x.value === ')') depth--;
        }
        // Skip type annotation
        if (this.peek() && this.peek()!.value === ':') {
          this.consume();
          this.parseType();
        }
        continue;
      }

      const field = this.parseField();
      if (field) fields.push(field);
    }
    return fields;
  }

  private parseField(): TsField | null {
    const t = this.peek();
    if (!t) return null;

    // Skip readonly
    if (t.type === 'ident' && t.value === 'readonly') this.consume();

    const nameToken = this.peek();
    if (!nameToken || (nameToken.type !== 'ident' && nameToken.type !== 'string')) return null;
    const name = nameToken.value;
    this.consume();

    // Optional marker
    let optional = false;
    if (this.peek() && this.peek()!.value === '?') {
      optional = true;
      this.consume();
    }

    // Expect ':'
    if (!this.peek() || this.peek()!.type !== 'colon') {
      // Skip to next semicolon or brace
      while (this.pos < this.tokens.length && this.peek()!.value !== ';' && this.peek()!.value !== '}') {
        this.consume();
      }
      return null;
    }
    this.consume(); // ':'

    const type = this.parseType();

    // Skip ';' or ','
    if (this.peek() && (this.peek()!.value === ';' || this.peek()!.value === ',')) this.consume();

    return { name, optional, type };
  }

  parseType(): TsType {
    const left = this.parsePrimaryType();

    // Union
    if (this.peek() && this.peek()!.value === '|') {
      const members: TsType[] = [left];
      while (this.peek() && this.peek()!.value === '|') {
        this.consume(); // '|'
        members.push(this.parsePrimaryType());
      }
      return { kind: 'union', members };
    }

    // Intersection — treat as first member
    if (this.peek() && this.peek()!.value === '&') {
      this.consume();
      this.parsePrimaryType(); // discard
      return left;
    }

    return left;
  }

  private parsePrimaryType(): TsType {
    const t = this.peek();
    if (!t) return { kind: 'primitive', name: 'any' };

    // Object type
    if (t.value === '{') {
      this.consume();
      const fields = this.parseFields();
      return { kind: 'object', fields };
    }

    // Tuple / array literal
    if (t.value === '[') {
      this.consume();
      let depth = 1;
      while (this.pos < this.tokens.length && depth > 0) {
        const x = this.consume();
        if (x.value === '[') depth++;
        else if (x.value === ']') depth--;
      }
      return { kind: 'array', item: { kind: 'primitive', name: 'any' } };
    }

    // Parenthesized or function type
    if (t.value === '(') {
      this.consume();
      const inner = this.parseType();
      if (this.peek() && this.peek()!.value === ')') this.consume();
      // If followed by '=>', it's a function type
      if (this.peek() && this.peek()!.value === '=') {
        this.consume();
        if (this.peek() && this.peek()!.value === '>') {
          this.consume();
          this.parseType(); // return type
        }
        return { kind: 'primitive', name: 'any' };
      }
      return inner;
    }

    if (t.type === 'string') {
      this.consume();
      let baseType: TsType = { kind: 'literal', value: t.value };
      // Array suffix
      while (this.peek() && this.peek()!.value === '[') {
        this.consume();
        if (this.peek() && this.peek()!.value === ']') this.consume();
        baseType = { kind: 'array', item: baseType };
      }
      return baseType;
    }

    if (t.type === 'number') {
      this.consume();
      return { kind: 'literal', value: t.value };
    }

    if (t.type !== 'ident') {
      this.consume();
      return { kind: 'primitive', name: 'any' };
    }

    this.consume();
    const name = t.value;

    // Skip generics
    if (this.peek() && this.peek()!.value === '<') {
      let depth = 1;
      this.consume();
      while (this.pos < this.tokens.length && depth > 0) {
        const x = this.consume();
        if (x.value === '<') depth++;
        else if (x.value === '>') depth--;
      }
    }

    let baseType: TsType;

    if (name === 'Array' || name === 'ReadonlyArray') {
      // Array<T> — generics already consumed; treat as any array
      baseType = { kind: 'array', item: { kind: 'primitive', name: 'any' } };
    } else if (name === 'string' || name === 'number' || name === 'boolean' || name === 'null' || name === 'undefined' || name === 'any' || name === 'unknown' || name === 'never' || name === 'void') {
      baseType = { kind: 'primitive', name };
    } else {
      baseType = { kind: 'ref', name };
    }

    // Array suffix []
    while (this.peek() && this.peek()!.value === '[') {
      this.consume();
      if (this.peek() && this.peek()!.value === ']') this.consume();
      baseType = { kind: 'array', item: baseType };
    }

    return baseType;
  }
}

// ─── Code generator ──────────────────────────────────────────────────────────

function tsTypeToZod(type: TsType, optional: boolean): string {
  let zodExpr = '';

  switch (type.kind) {
    case 'primitive':
      switch (type.name) {
        case 'string': zodExpr = 'z.string()'; break;
        case 'number': zodExpr = 'z.number()'; break;
        case 'boolean': zodExpr = 'z.boolean()'; break;
        case 'null': zodExpr = 'z.null()'; break;
        case 'undefined': zodExpr = 'z.undefined()'; break;
        case 'never': zodExpr = 'z.never()'; break;
        case 'void': zodExpr = 'z.void()'; break;
        default: zodExpr = 'z.unknown()';
      }
      break;
    case 'array':
      zodExpr = `z.array(${tsTypeToZod(type.item, false)})`;
      break;
    case 'object': {
      const fields = type.fields.map(f => {
        const fieldZod = tsTypeToZod(f.type, f.optional);
        return `  ${f.name}: ${fieldZod}`;
      }).join(',\n');
      zodExpr = `z.object({\n${fields}\n})`;
      break;
    }
    case 'union': {
      // Check if it's a simple nullable union (T | null)
      const nonNull = type.members.filter(m => !(m.kind === 'primitive' && m.name === 'null'));
      const hasNull = nonNull.length < type.members.length;

      if (nonNull.length === 1 && hasNull) {
        zodExpr = `${tsTypeToZod(nonNull[0], false)}.nullable()`;
        break;
      }

      // Check if all members are literal strings
      const allLiterals = type.members.every(m => m.kind === 'literal');
      if (allLiterals) {
        const values = type.members.map(m => {
          const lit = m as Extract<TsType, { kind: 'literal' }>;
          return `z.literal(${JSON.stringify(lit.value)})`;
        });
        if (values.length === 1) {
          zodExpr = values[0];
        } else {
          zodExpr = `z.union([${values.join(', ')}])`;
        }
        break;
      }

      const members = type.members.map(m => tsTypeToZod(m, false));
      zodExpr = members.length === 1 ? members[0] : `z.union([${members.join(', ')}])`;
      break;
    }
    case 'literal': {
      const v = type.value;
      if (v === 'true' || v === 'false') zodExpr = `z.literal(${v})`;
      else if (!isNaN(Number(v))) zodExpr = `z.literal(${v})`;
      else zodExpr = `z.literal(${JSON.stringify(v)})`;
      break;
    }
    case 'ref':
      zodExpr = `${type.name}Schema`;
      break;
    default:
      zodExpr = 'z.unknown()';
  }

  if (optional) zodExpr += '.optional()';
  return zodExpr;
}

function declToZod(decl: TsDecl): string {
  const schemaName = `${decl.name}Schema`;

  if (decl.kind === 'interface' && decl.fields) {
    const fields = decl.fields.map(f => {
      const zodExpr = tsTypeToZod(f.type, f.optional);
      return `  ${f.name}: ${zodExpr}`;
    }).join(',\n');
    return `const ${schemaName} = z.object({\n${fields}\n});\nexport type ${decl.name} = z.infer<typeof ${schemaName}>;`;
  }

  if (decl.kind === 'type' && decl.typeAlias) {
    const zodExpr = tsTypeToZod(decl.typeAlias, false);
    return `const ${schemaName} = ${zodExpr};\nexport type ${decl.name} = z.infer<typeof ${schemaName}>;`;
  }

  return `// Could not convert ${decl.name}`;
}

export function convertTsToZod(input: string): string {
  if (!input.trim()) return '';

  let tokens: Token[];
  try {
    tokens = tokenize(input);
  } catch (e) {
    throw new Error('Tokenization failed: ' + (e instanceof Error ? e.message : String(e)));
  }

  const parser = new Parser(tokens);
  let decls: TsDecl[];
  try {
    decls = parser.parseAll();
  } catch (e) {
    throw new Error('Parse failed: ' + (e instanceof Error ? e.message : String(e)));
  }

  if (decls.length === 0) {
    throw new Error('No interfaces or type aliases found. Please provide a TypeScript interface or type definition.');
  }

  const parts: string[] = ["import { z } from 'zod';", ''];
  for (const decl of decls) {
    parts.push(declToZod(decl));
    parts.push('');
  }

  return parts.join('\n');
}
