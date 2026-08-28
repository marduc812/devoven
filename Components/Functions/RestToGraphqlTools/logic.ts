// Pure TypeScript — no browser APIs.

export interface RestDescription {
  method: string;
  path: string;
  request?: unknown;
  response?: unknown;
}

/**
 * Parse the multiline REST description input.
 * Format:
 *   METHOD /path
 *   REQUEST:
 *   { json... }
 *   RESPONSE:
 *   { json... }
 */
export function parseRestInput(input: string): RestDescription {
  const trimmed = input.trim();
  const lines = trimmed.split(/\r?\n/);

  let method = 'GET';
  let path = '/';
  let requestJson = '';
  let responseJson = '';
  let section: 'none' | 'request' | 'response' = 'none';

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Try to parse METHOD /path on first non-empty line
    if (method === 'GET' && path === '/') {
      const methodMatch = trimmedLine.match(/^(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\s+(\/\S*)$/i);
      if (methodMatch) {
        method = methodMatch[1].toUpperCase();
        path = methodMatch[2];
        continue;
      }
    }

    if (/^REQUEST:?\s*$/i.test(trimmedLine)) {
      section = 'request';
      continue;
    }
    if (/^RESPONSE:?\s*$/i.test(trimmedLine)) {
      section = 'response';
      continue;
    }

    if (section === 'request') requestJson += line + '\n';
    if (section === 'response') responseJson += line + '\n';
  }

  let request: unknown;
  let response: unknown;

  try { request = JSON.parse(requestJson.trim()); } catch { request = null; }
  try { response = JSON.parse(responseJson.trim()); } catch { response = null; }

  return { method, path, request, response };
}

/**
 * Convert a path like /users/{id}/posts to a camelCase name like userIdPosts
 */
function pathToName(path: string): string {
  return path
    .replace(/^\//, '')
    .replace(/\{([^}]+)\}/g, 'By$1')
    .replace(/[^a-zA-Z0-9]+([a-zA-Z])/g, (_, c) => c.toUpperCase())
    .replace(/^[A-Z]/, c => c.toLowerCase())
    || 'resource';
}

/**
 * Convert a path like /users/{id} to a PascalCase type name like User
 */
function pathToTypeName(path: string): string {
  const segments = path.replace(/^\//, '').split('/').filter(s => !s.startsWith('{'));
  if (segments.length === 0) return 'Resource';
  const last = segments[segments.length - 1];
  return last.charAt(0).toUpperCase() + last.slice(1).replace(/s$/, '');
}

type JsonObject = { [key: string]: unknown };

/**
 * Generate GraphQL type definition from a JSON object.
 */
function jsonToGraphqlType(typeName: string, obj: unknown, indent = ''): string {
  if (obj === null || obj === undefined || typeof obj !== 'object' || Array.isArray(obj)) {
    return `${indent}type ${typeName} {\n${indent}  id: ID\n${indent}}`;
  }

  const fields = obj as JsonObject;
  const lines: string[] = [`${indent}type ${typeName} {`];

  for (const [key, val] of Object.entries(fields)) {
    const gqlType = inferGraphqlType(key, val);
    lines.push(`${indent}  ${key}: ${gqlType}`);
  }

  lines.push(`${indent}}`);
  return lines.join('\n');
}

function inferGraphqlType(key: string, val: unknown): string {
  if (val === null || val === undefined) return 'String';
  if (typeof val === 'boolean') return 'Boolean';
  if (typeof val === 'number') {
    return Number.isInteger(val) ? 'Int' : 'Float';
  }
  if (typeof val === 'string') {
    if (key.toLowerCase().includes('id')) return 'ID';
    if (/date|time|at$/i.test(key)) return 'String'; // Could be DateTime
    return 'String';
  }
  if (Array.isArray(val)) {
    if (val.length > 0) {
      const innerType = inferGraphqlType(key, val[0]);
      return `[${innerType}]`;
    }
    return '[String]';
  }
  if (typeof val === 'object') {
    // Nested object - use PascalCase of key
    return key.charAt(0).toUpperCase() + key.slice(1);
  }
  return 'String';
}

/**
 * Generate GraphQL input type from request JSON.
 */
function jsonToInputType(typeName: string, obj: unknown): string {
  if (obj === null || obj === undefined || typeof obj !== 'object' || Array.isArray(obj)) {
    return `input ${typeName} {\n  # No request body\n}`;
  }

  const fields = obj as JsonObject;
  const lines: string[] = [`input ${typeName} {`];

  for (const [key, val] of Object.entries(fields)) {
    const gqlType = inferGraphqlType(key, val);
    lines.push(`  ${key}: ${gqlType}`);
  }

  lines.push('}');
  return lines.join('\n');
}

/**
 * Generate the full GraphQL output: types, query/mutation, resolver skeleton.
 */
export function generateGraphql(input: string): string {
  if (!input.trim()) return '';

  let desc: RestDescription;
  try {
    desc = parseRestInput(input);
  } catch (e: unknown) {
    return 'Error: ' + (e instanceof Error ? e.message : String(e));
  }

  const { method, path, request, response } = desc;
  const opName = pathToName(path);
  const typeName = pathToTypeName(path);
  const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  const opType = isMutation ? 'Mutation' : 'Query';

  const sections: string[] = [];

  // --- Type definition ---
  const responseObj = Array.isArray(response) ? response[0] : response;
  const typeDef = jsonToGraphqlType(typeName, responseObj);
  sections.push('# GraphQL Type Definition\n' + typeDef);

  // --- Input type (for mutations with request body) ---
  if (isMutation && request) {
    const inputTypeName = typeName + 'Input';
    const inputDef = jsonToInputType(inputTypeName, request);
    sections.push('# Input Type\n' + inputDef);
  }

  // --- Query or Mutation ---
  const pathParams = (path.match(/\{([^}]+)\}/g) || []).map(p => p.replace(/[{}]/g, ''));
  const hasId = pathParams.length > 0;
  const returnType = Array.isArray(response) ? `[${typeName}]` : typeName;

  let operation: string;
  if (isMutation && request) {
    const inputTypeName = typeName + 'Input';
    const argList = hasId
      ? `id: ID!, input: ${inputTypeName}`
      : `input: ${inputTypeName}`;
    operation = `type ${opType} {\n  ${opName}(${argList}): ${returnType}\n}`;
  } else if (hasId) {
    const argList = pathParams.map(p => `${p}: ID!`).join(', ');
    operation = `type ${opType} {\n  ${opName}(${argList}): ${returnType}\n}`;
  } else {
    operation = `type ${opType} {\n  ${opName}: ${returnType}\n}`;
  }

  sections.push(`# ${opType}\n` + operation);

  // --- Example query/mutation document ---
  const responseFields = generateFieldSelection(responseObj, 1);
  let exampleDoc: string;
  if (isMutation && request) {
    const inputTypeName = typeName + 'Input';
    const reqFields = generateVariableDoc(request, 2);
    const argList = hasId
      ? `($id: ID!, $input: ${inputTypeName})`
      : `($input: ${inputTypeName})`;
    const callArgs = hasId ? `(id: $id, input: $input)` : `(input: $input)`;
    exampleDoc = `mutation ${opName.charAt(0).toUpperCase() + opName.slice(1)}${argList} {\n  ${opName}${callArgs} {\n${responseFields}\n  }\n}\n\n# Variables:\n# {\n${reqFields}\n# }`;
  } else if (hasId) {
    const argList = pathParams.map(p => `($${p}: ID!)`).join('');
    const callArgs = `(${pathParams.map(p => `${p}: $${p}`).join(', ')})`;
    exampleDoc = `query ${opName.charAt(0).toUpperCase() + opName.slice(1)}${argList} {\n  ${opName}${callArgs} {\n${responseFields}\n  }\n}`;
  } else {
    exampleDoc = `query ${opName.charAt(0).toUpperCase() + opName.slice(1)} {\n  ${opName} {\n${responseFields}\n  }\n}`;
  }

  sections.push('# Example ' + (isMutation ? 'Mutation' : 'Query') + ' Document\n' + exampleDoc);

  // --- Resolver skeleton (JS) ---
  const resolverArgs = isMutation
    ? (hasId ? '{ id, input }' : '{ input }')
    : hasId
      ? `{ ${pathParams.join(', ')} }`
      : '_args';

  const fetchPath = path.replace(/\{([^}]+)\}/g, '${$1}');
  const fetchMethod = method;
  const hasBody = ['POST', 'PUT', 'PATCH'].includes(fetchMethod);

  const resolver = [
    '// Resolver Skeleton (JavaScript)',
    `const resolvers = {`,
    `  ${opType}: {`,
    `    ${opName}: async (parent, ${resolverArgs}, context) => {`,
    `      // TODO: replace with your actual data source`,
    hasBody
      ? `      const response = await fetch(\`https://api.example.com${fetchPath}\`, {`
      : `      const response = await fetch(\`https://api.example.com${fetchPath}\`);`,
  ];

  if (hasBody) {
    resolver.push(`        method: '${fetchMethod}',`);
    resolver.push(`        headers: { 'Content-Type': 'application/json' },`);
    resolver.push(`        body: JSON.stringify(input),`);
    resolver.push(`      });`);
  }

  resolver.push(`      return response.json();`);
  resolver.push(`    },`);
  resolver.push(`  },`);
  resolver.push(`};`);

  sections.push(resolver.join('\n'));

  return sections.join('\n\n' + '─'.repeat(50) + '\n\n');
}

function generateFieldSelection(obj: unknown, depth: number): string {
  const indent = '    '.repeat(depth);
  if (obj === null || obj === undefined || typeof obj !== 'object' || Array.isArray(obj)) {
    return `${indent}id\n${indent}# Add fields here`;
  }

  const fields = obj as JsonObject;
  const lines: string[] = [];
  for (const [key, val] of Object.entries(fields)) {
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      lines.push(`${indent}${key} {`);
      lines.push(generateFieldSelection(val, depth + 1));
      lines.push(`${indent}}`);
    } else if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object' && val[0] !== null) {
      lines.push(`${indent}${key} {`);
      lines.push(generateFieldSelection(val[0], depth + 1));
      lines.push(`${indent}}`);
    } else {
      lines.push(`${indent}${key}`);
    }
  }
  return lines.join('\n');
}

function generateVariableDoc(obj: unknown, depth: number): string {
  if (obj === null || obj === undefined || typeof obj !== 'object' || Array.isArray(obj)) {
    return '#   {}';
  }
  const indent = '#   ' + '  '.repeat(depth - 2);
  const fields = obj as JsonObject;
  const lines: string[] = [];
  for (const [key, val] of Object.entries(fields)) {
    lines.push(`${indent}"${key}": ${JSON.stringify(val)}`);
  }
  return lines.join(',\n');
}

/**
 * Auto-detect whether input looks like a REST description or GraphQL.
 */
export function detectRestOrGraphql(input: string): 'rest' | 'graphql' {
  const trimmed = input.trim();
  if (trimmed.startsWith('type ') || trimmed.startsWith('query ') || trimmed.startsWith('mutation ')) {
    return 'graphql';
  }
  return 'rest';
}
