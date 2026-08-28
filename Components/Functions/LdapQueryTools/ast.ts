// LDAP filter AST and RFC 4515 serialization. Pure logic — no browser APIs.

export type CondOp = '=' | '>=' | '<=' | '~=';

export type FilterNode =
  | { type: 'and' | 'or'; children: FilterNode[] }
  | { type: 'not'; child: FilterNode }
  | { type: 'cond'; attr: string; op: CondOp; value: string; raw?: boolean };

// RFC 4515 §3. Backslash must be replaced first, otherwise the escapes the
// later replacements introduce get escaped a second time.
export function escapeValue(value: string): string {
  return value
    .replace(/\\/g, '\\5c')
    .replace(/\*/g, '\\2a')
    .replace(/\(/g, '\\28')
    .replace(/\)/g, '\\29')
    .replace(/\0/g, '\\00');
}

export function serialize(node: FilterNode): string {
  switch (node.type) {
    case 'cond':
      return `(${node.attr}${node.op}${node.raw ? node.value : escapeValue(node.value)})`;
    case 'not':
      return `(!${serialize(node.child)})`;
    case 'and':
    case 'or': {
      // A single child needs no grouping operator, and omitting it keeps
      // simple one-condition filters readable.
      if (node.children.length === 1) return serialize(node.children[0]);
      const symbol = node.type === 'and' ? '&' : '|';
      return `(${symbol}${node.children.map(serialize).join('')})`;
    }
  }
}
