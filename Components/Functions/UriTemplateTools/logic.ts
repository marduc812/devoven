// RFC 6570 URI Template expander

export type VariableMap = Record<string, string | string[]>;

function encodeUnreserved(s: string): string {
  return encodeURIComponent(s);
}

// Reserved chars: :/?#[]@!$&'()*+,;=
function encodeReserved(s: string): string {
  return encodeURI(s).replace(/%25/g, '%25');
}

function expandValue(value: string | string[], operator: string, varName: string, maxLength: number): string {
  if (Array.isArray(value)) {
    if (value.length === 0) return '';
    if (operator === '+' || operator === '#') {
      return value.map(v => encodeReserved(v)).join(',');
    } else if (operator === ';') {
      return value.map(v => varName + '=' + encodeUnreserved(v)).join(';');
    } else if (operator === '?') {
      return value.map(v => varName + '=' + encodeUnreserved(v)).join('&');
    } else if (operator === '&') {
      return value.map(v => varName + '=' + encodeUnreserved(v)).join('&');
    } else {
      return value.map(v => encodeUnreserved(v)).join(',');
    }
  }
  let str = String(value);
  if (maxLength > 0 && str.length > maxLength) {
    str = str.slice(0, maxLength);
  }
  if (operator === '+' || operator === '#') {
    return encodeReserved(str);
  }
  return encodeUnreserved(str);
}

function expandExpression(expr: string, variables: VariableMap): string {
  const operators = '+#./;?&';
  let operator = '';
  let rest = expr;

  if (expr.length > 0 && operators.indexOf(expr[0]) !== -1) {
    operator = expr[0];
    rest = expr.slice(1);
  }

  const varList = rest.split(',');
  const parts: string[] = [];
  let first = true;

  for (const varSpec of varList) {
    const colonIdx = varSpec.indexOf(':');
    let varName: string;
    let maxLength = 0;

    if (colonIdx !== -1) {
      varName = varSpec.slice(0, colonIdx);
      maxLength = parseInt(varSpec.slice(colonIdx + 1), 10) || 0;
    } else {
      varName = varSpec.trim();
    }
    varName = varName.trim().replace(/\*$/, '');

    const value = variables[varName];
    if (value === undefined || value === null || (Array.isArray(value) && value.length === 0)) {
      continue;
    }

    const expanded = expandValue(value, operator, varName, maxLength);
    if (expanded === '') continue;

    let prefix = '';
    if (first) {
      switch (operator) {
        case '#': prefix = '#'; break;
        case '.': prefix = '.'; break;
        case '/': prefix = '/'; break;
        case ';': prefix = ';'; break;
        case '?': prefix = '?'; break;
        case '&': prefix = '&'; break;
        default: break;
      }
      first = false;
    } else {
      switch (operator) {
        case '+': prefix = ','; break;
        case '#': prefix = ','; break;
        case '.': prefix = '.'; break;
        case '/': prefix = '/'; break;
        case ';': prefix = ';'; break;
        case '?': prefix = '&'; break;
        case '&': prefix = '&'; break;
        default: prefix = ','; break;
      }
    }

    let part: string;
    if (operator === ';') {
      // Already has varName= in expandValue for arrays, handle scalar here
      if (!Array.isArray(value)) {
        part = expanded ? varName + '=' + expanded : varName;
      } else {
        part = expanded;
      }
    } else if (operator === '?' || operator === '&') {
      if (!Array.isArray(value)) {
        part = varName + '=' + expanded;
      } else {
        part = expanded;
      }
    } else {
      part = expanded;
    }

    parts.push(prefix + part);
  }

  return parts.join('');
}

export function expandUriTemplate(template: string, variables: VariableMap): string {
  return template.replace(/\{([^}]+)\}/g, (_match, expr: string) => {
    try {
      return expandExpression(expr, variables);
    } catch {
      return _match;
    }
  });
}

export function parseVariableLines(lines: string): VariableMap {
  const vars: VariableMap = {};
  for (const line of lines.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!key) continue;
    // Support comma-separated list values
    if (val.startsWith('[') && val.endsWith(']')) {
      vars[key] = val
        .slice(1, -1)
        .split(',')
        .map(s => s.trim())
        .filter(s => s.length > 0);
    } else {
      vars[key] = val;
    }
  }
  return vars;
}

export function extractTemplateVars(template: string): string[] {
  const found: string[] = [];
  const matches = template.match(/\{([^}]+)\}/g);
  if (!matches) return found;
  for (const m of matches) {
    const inner = m.slice(1, -1);
    const operators = '+#./;?&';
    const rest = operators.indexOf(inner[0]) !== -1 ? inner.slice(1) : inner;
    for (const varSpec of rest.split(',')) {
      const colonIdx = varSpec.indexOf(':');
      const varName = (colonIdx !== -1 ? varSpec.slice(0, colonIdx) : varSpec)
        .trim()
        .replace(/\*$/, '');
      if (varName && found.indexOf(varName) === -1) {
        found.push(varName);
      }
    }
  }
  return found;
}
