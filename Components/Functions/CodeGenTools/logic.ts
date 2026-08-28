// All functions in this file are pure (no React, no browser APIs).

// ─── JSON to Python ───────────────────────────────────────────────────────────

function toPythonValue(val: unknown, indent: number): string {
  const pad = '    '.repeat(indent);
  const pad1 = '    '.repeat(indent + 1);

  if (val === null) return 'None';
  if (val === true) return 'True';
  if (val === false) return 'False';
  if (typeof val === 'string') return JSON.stringify(val);
  if (typeof val === 'number') return String(val);
  if (Array.isArray(val)) {
    if (val.length === 0) return '[]';
    const items = val.map((v) => pad1 + toPythonValue(v, indent + 1)).join(',\n');
    return `[\n${items}\n${pad}]`;
  }
  if (typeof val === 'object') {
    const entries = Object.entries(val as Record<string, unknown>);
    if (entries.length === 0) return '{}';
    const items = entries
      .map(([k, v]) => `${pad1}${JSON.stringify(k)}: ${toPythonValue(v, indent + 1)}`)
      .join(',\n');
    return `{\n${items}\n${pad}}`;
  }
  return String(val);
}

export function jsonToPython(jsonStr: string): string {
  const data = JSON.parse(jsonStr);
  return toPythonValue(data, 0);
}

function inferPythonType(val: unknown): string {
  if (val === null) return 'Optional[Any]';
  if (typeof val === 'boolean') return 'bool';
  if (typeof val === 'number') return Number.isInteger(val) ? 'int' : 'float';
  if (typeof val === 'string') return 'str';
  if (Array.isArray(val)) return 'List[Any]';
  return 'dict';
}

export function jsonToPythonDataclass(jsonStr: string): string {
  const data = JSON.parse(jsonStr);
  if (typeof data !== 'object' || Array.isArray(data) || data === null) {
    return '# Cannot convert non-object to dataclass\n' + jsonToPython(jsonStr);
  }

  const lines = [
    'from dataclasses import dataclass',
    'from typing import Any, List, Optional',
    '',
    '@dataclass',
    'class Model:',
  ];
  for (const [key, val] of Object.entries(data as Record<string, unknown>)) {
    const pyType = inferPythonType(val);
    lines.push(`    ${key}: ${pyType}`);
  }
  return lines.join('\n');
}

// ─── JSON to PHP ──────────────────────────────────────────────────────────────

function toPhpValue(val: unknown, indent: number): string {
  const pad = '    '.repeat(indent);
  const pad1 = '    '.repeat(indent + 1);

  if (val === null) return 'null';
  if (val === true) return 'true';
  if (val === false) return 'false';
  if (typeof val === 'string') return `'${val.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  if (typeof val === 'number') return String(val);
  if (Array.isArray(val)) {
    if (val.length === 0) return '[]';
    const items = val
      .map((v, i) => `${pad1}${i} => ${toPhpValue(v, indent + 1)}`)
      .join(',\n');
    return `[\n${items},\n${pad}]`;
  }
  if (typeof val === 'object') {
    const entries = Object.entries(val as Record<string, unknown>);
    if (entries.length === 0) return '[]';
    const items = entries
      .map(([k, v]) => `${pad1}'${k}' => ${toPhpValue(v, indent + 1)}`)
      .join(',\n');
    return `[\n${items},\n${pad}]`;
  }
  return String(val);
}

export function jsonToPhp(jsonStr: string): string {
  const data = JSON.parse(jsonStr);
  return `<?php\n\n$data = ${toPhpValue(data, 0)};\n`;
}

// ─── JSON to Java ─────────────────────────────────────────────────────────────

function inferJavaType(val: unknown): string {
  if (val === null) return 'Object';
  if (typeof val === 'boolean') return 'Boolean';
  if (typeof val === 'number') return Number.isInteger(val) ? 'Integer' : 'Double';
  if (typeof val === 'string') return 'String';
  if (Array.isArray(val)) return 'List<Object>';
  return 'Map<String, Object>';
}

export function jsonToJava(jsonStr: string, className = 'Model'): string {
  const data = JSON.parse(jsonStr);
  if (typeof data !== 'object' || Array.isArray(data) || data === null) {
    return '// Input must be a JSON object';
  }

  const entries = Object.entries(data as Record<string, unknown>);
  const lines = [`public class ${className} {`];

  for (const [key, val] of entries) {
    const javaType = inferJavaType(val);
    lines.push(`    private ${javaType} ${key};`);
  }

  lines.push('');

  for (const [key, val] of entries) {
    const javaType = inferJavaType(val);
    const capitalized = key.charAt(0).toUpperCase() + key.slice(1);
    lines.push(`    public ${javaType} get${capitalized}() { return ${key}; }`);
    lines.push(`    public void set${capitalized}(${javaType} ${key}) { this.${key} = ${key}; }`);
  }

  lines.push('}');
  return lines.join('\n');
}
