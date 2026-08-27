const SQL_KEYWORDS = [
  'SELECT', 'DISTINCT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'IN', 'EXISTS',
  'BETWEEN', 'LIKE', 'IS', 'NULL', 'AS', 'ON', 'JOIN', 'INNER', 'LEFT', 'RIGHT',
  'FULL', 'OUTER', 'CROSS', 'NATURAL', 'UNION', 'ALL', 'INTERSECT', 'EXCEPT',
  'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE', 'TABLE',
  'ALTER', 'DROP', 'TRUNCATE', 'INDEX', 'VIEW', 'DATABASE', 'SCHEMA',
  'GROUP', 'BY', 'HAVING', 'ORDER', 'ASC', 'DESC', 'LIMIT', 'OFFSET',
  'WITH', 'RECURSIVE', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
  'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 'UNIQUE', 'CHECK', 'DEFAULT',
  'CONSTRAINT', 'AUTO_INCREMENT', 'AUTOINCREMENT', 'SERIAL', 'SEQUENCE',
  'BEGIN', 'COMMIT', 'ROLLBACK', 'TRANSACTION', 'SAVEPOINT',
  'GRANT', 'REVOKE', 'PRIVILEGES', 'TRIGGER', 'PROCEDURE', 'FUNCTION',
  'RETURNS', 'RETURN', 'DECLARE', 'IF', 'THEN', 'LOOP', 'WHILE', 'DO',
  'EXPLAIN', 'ANALYZE', 'VERBOSE', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX',
  'COALESCE', 'NULLIF', 'CAST', 'CONVERT', 'EXTRACT', 'DATE', 'TIME',
  'NOW', 'CURRENT_DATE', 'CURRENT_TIME', 'CURRENT_TIMESTAMP',
  'TOP', 'ROWNUM', 'FETCH', 'NEXT', 'ROWS', 'ONLY', 'FOLLOWING', 'PRECEDING',
  'OVER', 'PARTITION', 'WINDOW', 'FILTER', 'WITHIN',
];

const KEYWORD_SET = new Set(SQL_KEYWORDS);

// Tokens that start a new line with no indent
const NEWLINE_BEFORE: Set<string> = new Set([
  'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'OFFSET',
  'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN', 'CROSS JOIN', 'NATURAL JOIN',
  'JOIN', 'UNION', 'UNION ALL', 'INTERSECT', 'EXCEPT',
  'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM',
  'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE', 'TRUNCATE TABLE',
  'ON', 'AND', 'OR',
]);

type Token = {
  type: 'keyword' | 'string' | 'comment' | 'word' | 'punct' | 'whitespace';
  value: string;
};

function tokenize(sql: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < sql.length) {
    // Single-line comment
    if (sql[i] === '-' && sql[i + 1] === '-') {
      let j = i;
      while (j < sql.length && sql[j] !== '\n') j++;
      tokens.push({ type: 'comment', value: sql.slice(i, j) });
      i = j;
      continue;
    }
    // Block comment
    if (sql[i] === '/' && sql[i + 1] === '*') {
      let j = i + 2;
      while (j < sql.length - 1 && !(sql[j] === '*' && sql[j + 1] === '/')) j++;
      j += 2;
      tokens.push({ type: 'comment', value: sql.slice(i, j) });
      i = j;
      continue;
    }
    // String literals (single or double quoted)
    if (sql[i] === "'" || sql[i] === '"' || sql[i] === '`') {
      const quote = sql[i];
      let j = i + 1;
      while (j < sql.length) {
        if (sql[j] === quote && sql[j - 1] !== '\\') break;
        j++;
      }
      j++;
      tokens.push({ type: 'string', value: sql.slice(i, j) });
      i = j;
      continue;
    }
    // Whitespace
    if (/\s/.test(sql[i])) {
      let j = i;
      while (j < sql.length && /\s/.test(sql[j])) j++;
      tokens.push({ type: 'whitespace', value: sql.slice(i, j) });
      i = j;
      continue;
    }
    // Words / identifiers
    if (/[a-zA-Z_]/.test(sql[i])) {
      let j = i;
      while (j < sql.length && /[a-zA-Z0-9_]/.test(sql[j])) j++;
      const word = sql.slice(i, j);
      const upper = word.toUpperCase();
      tokens.push({ type: KEYWORD_SET.has(upper) ? 'keyword' : 'word', value: word });
      i = j;
      continue;
    }
    // Punctuation
    tokens.push({ type: 'punct', value: sql[i] });
    i++;
  }

  return tokens;
}

function mergeCompoundKeywords(tokens: Token[]): Token[] {
  const result: Token[] = [];
  let i = 0;

  while (i < tokens.length) {
    const tok = tokens[i];
    if (tok.type === 'keyword') {
      const upper = tok.value.toUpperCase();

      // Try to merge with next keyword (skip whitespace)
      let j = i + 1;
      while (j < tokens.length && tokens[j].type === 'whitespace') j++;

      if (j < tokens.length && tokens[j].type === 'keyword') {
        const next = tokens[j].value.toUpperCase();
        const compound = upper + ' ' + next;

        // Try triple compound
        let k = j + 1;
        while (k < tokens.length && tokens[k].type === 'whitespace') k++;

        if (k < tokens.length && tokens[k].type === 'keyword') {
          const triple = compound + ' ' + tokens[k].value.toUpperCase();
          if (NEWLINE_BEFORE.has(triple)) {
            result.push({ type: 'keyword', value: triple });
            i = k + 1;
            continue;
          }
        }

        if (NEWLINE_BEFORE.has(compound)) {
          result.push({ type: 'keyword', value: compound });
          i = j + 1;
          continue;
        }
      }
    }
    result.push(tok);
    i++;
  }

  return result;
}

export function formatSql(sql: string): string {
  if (!sql.trim()) return '';

  let tokens = tokenize(sql);
  tokens = mergeCompoundKeywords(tokens);

  const lines: string[] = [];
  let current = '';
  let indentLevel = 0;
  let parenDepth = 0;

  const indent = () => '  '.repeat(indentLevel);

  const flushLine = () => {
    const trimmed = current.trim();
    if (trimmed) lines.push(indent() + trimmed);
    current = '';
  };

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];

    if (tok.type === 'whitespace') {
      if (current.trim()) current += ' ';
      continue;
    }

    if (tok.type === 'comment') {
      flushLine();
      lines.push(indent() + tok.value.trim());
      continue;
    }

    if (tok.type === 'keyword') {
      const upper = tok.value.toUpperCase();

      if (NEWLINE_BEFORE.has(upper)) {
        flushLine();
        // AND/OR get extra indent under WHERE
        if (upper === 'AND' || upper === 'OR') {
          current = upper + ' ';
        } else {
          current = upper + ' ';
        }
        continue;
      }
    }

    if (tok.type === 'punct') {
      if (tok.value === '(') {
        parenDepth++;
        current += tok.value;
        continue;
      }
      if (tok.value === ')') {
        parenDepth = Math.max(0, parenDepth - 1);
        current += tok.value;
        continue;
      }
      if (tok.value === ',') {
        current += ',';
        if (parenDepth === 0) {
          flushLine();
        } else {
          current += ' ';
        }
        continue;
      }
      if (tok.value === ';') {
        current += ';';
        flushLine();
        lines.push('');
        continue;
      }
    }

    current += tok.type === 'keyword' ? tok.value.toUpperCase() : tok.value;
  }

  flushLine();

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}
