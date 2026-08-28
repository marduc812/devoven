// All functions in this file are pure (no React, no browser APIs).

export type OpenApiResult = {
  yaml: string;
  json: string;
  error?: string;
};

export type ParsedEndpoint = {
  method: string;
  path: string;
  params: ParsedParam[];
  requestBody: string | null;
  responses: ParsedResponse[];
};

export type ParsedParam = {
  name: string;
  type: string;
  required: boolean;
  location: 'path' | 'query';
};

export type ParsedResponse = {
  status: number;
  description: string;
  fields: string[];
};

/**
 * Parse a simple DSL:
 *   GET /users/{id}
 *   params: id (integer, required), page (integer, optional)
 *   body: {name, email}
 *   response: 200 {id, name, email}
 */
export function parseEndpointDsl(input: string): ParsedEndpoint {
  const lines = input.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) throw new Error('Empty input');

  const firstLine = lines[0];
  const methodMatch = firstLine.match(/^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+(\S+)/i);
  if (!methodMatch) throw new Error('First line must be: METHOD /path (e.g. GET /users/{id})');

  const method = methodMatch[1].toUpperCase();
  const path = methodMatch[2];

  const params: ParsedParam[] = [];
  const responses: ParsedResponse[] = [];
  let requestBody: string | null = null;

  // Extract path param names from the URL
  const pathParamNames: string[] = [];
  const pathRegex = /\{([^}]+)\}/g;
  let m: RegExpExecArray | null;
  while ((m = pathRegex.exec(path)) !== null) {
    pathParamNames.push(m[1]);
  }

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];

    if (/^params?:/i.test(line)) {
      const paramStr = line.replace(/^params?:/i, '').trim();
      const parts = paramStr.split(',');
      for (const part of parts) {
        const p = part.trim();
        const nameMatch = p.match(/^(\w+)\s*(?:\(([^)]*)\))?/);
        if (!nameMatch) continue;
        const name = nameMatch[1];
        const meta = (nameMatch[2] || '').toLowerCase();
        const type = meta.includes('integer') || meta.includes('int') ? 'integer'
          : meta.includes('number') || meta.includes('float') ? 'number'
          : meta.includes('bool') ? 'boolean'
          : 'string';
        const required = meta.includes('required') || pathParamNames.includes(name);
        const location: 'path' | 'query' = pathParamNames.includes(name) ? 'path' : 'query';
        params.push({ name, type, required, location });
      }
    } else if (/^body:/i.test(line) || /^request\s*body:/i.test(line)) {
      requestBody = line.replace(/^(request\s*body|body):/i, '').trim();
    } else if (/^response\s*:/i.test(line) || /^\d{3}/.test(line)) {
      const respLine = line.replace(/^response\s*:/i, '').trim();
      const statusMatch = respLine.match(/^(\d{3})\s*(.*)/);
      if (statusMatch) {
        const status = parseInt(statusMatch[1]);
        const rest = statusMatch[2].trim();
        const fields = rest.replace(/[{}]/g, '').split(',').map(f => f.trim()).filter(f => f.length > 0);
        const desc = status === 200 ? 'Successful response'
          : status === 201 ? 'Created'
          : status === 204 ? 'No content'
          : status === 400 ? 'Bad request'
          : status === 401 ? 'Unauthorized'
          : status === 403 ? 'Forbidden'
          : status === 404 ? 'Not found'
          : status === 500 ? 'Internal server error'
          : 'Response';
        responses.push({ status, description: desc, fields });
      }
    }
  }

  // Ensure path params are registered
  for (const name of pathParamNames) {
    if (!params.find(p => p.name === name)) {
      params.push({ name, type: 'string', required: true, location: 'path' });
    }
  }

  if (responses.length === 0) {
    responses.push({ status: 200, description: 'Successful response', fields: [] });
  }

  return { method, path, params, requestBody, responses };
}

function buildSchemaFromFields(fields: string[]): Record<string, unknown> {
  if (fields.length === 0) return { type: 'object' };
  const properties: Record<string, unknown> = {};
  for (const f of fields) {
    const name = f.replace(/[^a-zA-Z0-9_]/g, '');
    if (!name) continue;
    properties[name] = { type: 'string', example: '' };
  }
  return {
    type: 'object',
    properties,
    required: Object.keys(properties),
  };
}

function toYamlString(obj: unknown, indent = 0): string {
  const pad = '  '.repeat(indent);
  if (obj === null) return 'null';
  if (typeof obj === 'boolean') return obj ? 'true' : 'false';
  if (typeof obj === 'number') return String(obj);
  if (typeof obj === 'string') {
    // Needs quoting?
    if (/[:#\[\]{}&*?|<>,]/.test(obj) || obj.includes('\n') || obj === '') {
      return `"${obj.replace(/"/g, '\\"')}"`;
    }
    return obj;
  }
  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';
    return '\n' + obj.map(item => `${pad}- ${toYamlString(item, indent + 1)}`).join('\n');
  }
  if (typeof obj === 'object') {
    const entries = Object.entries(obj as Record<string, unknown>);
    if (entries.length === 0) return '{}';
    return '\n' + entries.map(([k, v]) => {
      const val = toYamlString(v, indent + 1);
      if (val.startsWith('\n')) return `${pad}${k}:${val}`;
      return `${pad}${k}: ${val}`;
    }).join('\n');
  }
  return String(obj);
}

function buildOpenApiObject(ep: ParsedEndpoint): Record<string, unknown> {
  const operationId = ep.method.toLowerCase() + ep.path.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');

  const parameters: unknown[] = ep.params.map(p => ({
    name: p.name,
    in: p.location,
    required: p.required,
    schema: { type: p.type },
    description: `${p.name} parameter`,
  }));

  const responsesObj: Record<string, unknown> = {};
  for (const r of ep.responses) {
    const schema = buildSchemaFromFields(r.fields);
    responsesObj[String(r.status)] = {
      description: r.description,
      content: r.fields.length > 0 ? {
        'application/json': { schema },
      } : undefined,
    };
    if (!responsesObj[String(r.status)]) {
      delete (responsesObj[String(r.status)] as Record<string, unknown>).content;
    }
  }

  const operation: Record<string, unknown> = {
    operationId,
    summary: `${ep.method} ${ep.path}`,
    parameters,
    responses: responsesObj,
  };

  if (ep.requestBody) {
    const fields = ep.requestBody.replace(/[{}]/g, '').split(',').map(f => f.trim()).filter(f => f.length > 0);
    operation.requestBody = {
      required: true,
      content: {
        'application/json': {
          schema: buildSchemaFromFields(fields),
        },
      },
    };
  }

  const apiObj: Record<string, unknown> = {
    openapi: '3.0.3',
    info: { title: 'API', version: '1.0.0' },
    paths: {
      [ep.path]: {
        [ep.method.toLowerCase()]: operation,
      },
    },
  };

  return apiObj;
}

export function generateOpenApiSnippet(input: string): OpenApiResult {
  if (!input.trim()) return { yaml: '', json: '' };
  try {
    const ep = parseEndpointDsl(input);
    const apiObj = buildOpenApiObject(ep);

    const json = JSON.stringify(apiObj, null, 2);

    // Build YAML manually to avoid external dependency
    const yaml = buildYaml(apiObj);

    return { yaml, json };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return { yaml: '', json: '', error: msg };
  }
}

function buildYaml(obj: Record<string, unknown>): string {
  const lines: string[] = [];

  function emit(val: unknown, indent: number, key?: string): void {
    const pad = '  '.repeat(indent);
    const prefix = key !== undefined ? `${pad}${key}: ` : pad;

    if (val === null || val === undefined) {
      lines.push(`${prefix}null`);
    } else if (typeof val === 'boolean') {
      lines.push(`${prefix}${val}`);
    } else if (typeof val === 'number') {
      lines.push(`${prefix}${val}`);
    } else if (typeof val === 'string') {
      const needsQuote = /[:#{}\[\],&*?|<>]/.test(val) || val.trim() !== val || val === '';
      const quoted = needsQuote ? `"${val.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"` : val;
      lines.push(`${prefix}${quoted}`);
    } else if (Array.isArray(val)) {
      if (val.length === 0) {
        lines.push(`${prefix}[]`);
      } else {
        if (key !== undefined) lines.push(`${pad}${key}:`);
        for (const item of val) {
          if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
            const entries = Object.entries(item as Record<string, unknown>);
            if (entries.length === 0) {
              lines.push(`${pad}- {}`);
            } else {
              const [firstKey, firstVal] = entries[0];
              const firstStr = typeof firstVal === 'string' ? firstVal : JSON.stringify(firstVal);
              const needQ = /[:#{}\[\],&*?|<>]/.test(firstStr);
              lines.push(`${pad}- ${firstKey}: ${needQ ? '"' + firstStr + '"' : firstStr}`);
              for (let j = 1; j < entries.length; j++) {
                emit(entries[j][1], indent + 1, entries[j][0]);
              }
            }
          } else {
            const itemStr = String(item);
            lines.push(`${pad}- ${itemStr}`);
          }
        }
      }
    } else if (typeof val === 'object') {
      const entries = Object.entries(val as Record<string, unknown>);
      if (key !== undefined) lines.push(`${pad}${key}:`);
      for (const [k, v] of entries) {
        emit(v, indent + 1, k);
      }
    }
  }

  const entries = Object.entries(obj);
  for (const [k, v] of entries) {
    emit(v, 0, k);
  }

  return lines.join('\n');
}
