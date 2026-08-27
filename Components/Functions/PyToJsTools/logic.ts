// Python to JavaScript Syntax Converter
// Pattern-based substitutions — not a full transpiler

export interface PyToJsResult {
  output: string;
  notes: string[];
}

/** Convert a single Python line to JavaScript syntax */
function convertLine(line: string): { out: string; note: string | null } {
  let out = line;
  let note: string | null = null;

  // f-strings: f"...{expr}..." → `...${expr}...`
  out = out.replace(/f"([^"]*)"/g, (_m, body: string) => {
    return '`' + body.replace(/\{([^}]+)\}/g, '${$1}') + '`';
  });
  out = out.replace(/f'([^']*)'/g, (_m, body: string) => {
    return '`' + body.replace(/\{([^}]+)\}/g, '${$1}') + '`';
  });

  // Comments: # comment → // comment (only outside strings handled approximately)
  out = out.replace(/^(\s*)#(.*)$/, '$1//$2');

  // print() → console.log()
  out = out.replace(/\bprint\s*\(/g, 'console.log(');

  // len(x) → x.length
  out = out.replace(/\blen\s*\(([^)]+)\)/g, (_m, inner: string) => {
    return inner.trim() + '.length';
  });

  // range(n) → Array.from({length: n}, (_, i) => i)
  // range(start, stop) → Array.from({length: stop - start}, (_, i) => i + start)
  out = out.replace(/\brange\s*\(([^)]+)\)/g, (_m, args: string) => {
    const parts = args.split(',').map((s: string) => s.trim());
    if (parts.length === 1) {
      return 'Array.from({length: ' + parts[0] + '}, (_, i) => i)';
    } else if (parts.length === 2) {
      return 'Array.from({length: ' + parts[1] + ' - ' + parts[0] + '}, (_, i) => i + ' + parts[0] + ')';
    }
    return _m;
  });

  // True / False / None → true / false / null
  out = out.replace(/\bTrue\b/g, 'true');
  out = out.replace(/\bFalse\b/g, 'false');
  out = out.replace(/\bNone\b/g, 'null');

  // def function → function
  out = out.replace(/^(\s*)def\s+(\w+)\s*\(([^)]*)\)\s*:/, (_m, indent: string, name: string, params: string) => {
    return indent + 'function ' + name + '(' + params + ') {';
  });

  // elif → else if
  out = out.replace(/\belif\s+(.+):/, 'else if ($1) {');

  // if/while/for ... : → if/while/for (...) {
  out = out.replace(/^(\s*)(if|while)\s+(.+):\s*$/, (_m, indent: string, kw: string, cond: string) => {
    // wrap condition in parens if not already
    const c = cond.trim();
    return indent + kw + ' (' + c + ') {';
  });

  // for var in list: → for (let var of list) {
  out = out.replace(/^(\s*)for\s+(\w+)\s+in\s+(.+):\s*$/, (_m, indent: string, v: string, iterable: string) => {
    return indent + 'for (let ' + v + ' of ' + iterable + ') {';
  });

  // else: → } else {
  out = out.replace(/^(\s*)else\s*:\s*$/, (_m, indent: string) => {
    return indent + '} else {';
  });

  // return statement (add semicolon hint via trailing comment is avoided, just keep as-is)

  // List comprehension: [expr for var in iterable] → iterable.map(var => expr)
  out = out.replace(/\[([^\]]+)\s+for\s+(\w+)\s+in\s+([^\]]+)\]/, (_m, expr: string, v: string, iter: string) => {
    note = 'List comprehension converted to .map() — review for accuracy';
    return iter.trim() + '.map(' + v + ' => ' + expr.trim() + ')';
  });

  // List comprehension with if: [expr for var in iterable if cond]
  out = out.replace(/\[([^\]]+)\s+for\s+(\w+)\s+in\s+([^\]]+)\s+if\s+([^\]]+)\]/, (_m, expr: string, v: string, iter: string, cond: string) => {
    note = 'List comprehension with filter converted — review for accuracy';
    return iter.trim() + '.filter(' + v + ' => ' + cond.trim() + ').map(' + v + ' => ' + expr.trim() + ')';
  });

  // dict() → {} hint
  out = out.replace(/\bdict\s*\(\s*\)/g, '{}');

  // list() → [] hint
  out = out.replace(/\blist\s*\(\s*\)/g, '[]');

  // str() → String()
  out = out.replace(/\bstr\s*\(/g, 'String(');

  // int() → parseInt(
  out = out.replace(/\bint\s*\(/g, 'parseInt(');

  // float() → parseFloat(
  out = out.replace(/\bfloat\s*\(/g, 'parseFloat(');

  // isinstance() note
  if (/\bisinstance\s*\(/.test(out)) {
    note = 'isinstance() has no direct JS equivalent — use typeof or instanceof';
  }

  // and / or / not → && / || / !
  // Only replace when surrounded by spaces to avoid partial matches
  out = out.replace(/\s+and\s+/g, ' && ');
  out = out.replace(/\s+or\s+/g, ' || ');
  out = out.replace(/\bnot\s+/g, '!');

  // Python ** exponent → Math.pow() or **
  out = out.replace(/(\w+)\s*\*\*\s*(\w+)/g, 'Math.pow($1, $2)');

  // // integer division → Math.floor(... / ...)
  out = out.replace(/(\w+)\s*\/\/\s*(\w+)/g, 'Math.floor($1 / $2)');

  // import → // import (not supported)
  if (/^\s*import\s/.test(out) || /^\s*from\s+\S+\s+import\s/.test(out)) {
    out = '// [JS equivalent needed]: ' + out.trim();
    note = 'Python imports must be replaced with JS module imports';
  }

  // class Foo: → class Foo {
  out = out.replace(/^(\s*)class\s+(\w+)\s*(?:\([^)]*\))?\s*:\s*$/, (_m, indent: string, name: string) => {
    return indent + 'class ' + name + ' {';
  });

  // pass → // pass (empty block)
  out = out.replace(/^\s*pass\s*$/, '  // empty block');

  return { out, note };
}

export function convertPyToJs(pythonCode: string): PyToJsResult {
  if (!pythonCode.trim()) return { output: '', notes: [] };

  const lines = pythonCode.split('\n');
  const outputLines: string[] = [];
  const notesSet: Set<string> = new Set();

  for (const line of lines) {
    const { out, note } = convertLine(line);
    outputLines.push(out);
    if (note) notesSet.add(note);
  }

  const notes = Array.from(notesSet);
  notes.unshift('Note: This is a syntax guide — review the output carefully before using.');

  return {
    output: outputLines.join('\n'),
    notes,
  };
}
