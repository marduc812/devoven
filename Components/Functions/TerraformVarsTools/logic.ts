// ── Terraform Variable Generator (JSON / key=value input) ─────────────────────

export interface TfVariable {
  name: string;
  type: string;
  defaultVal: string | null;
  description: string;
  nullable: boolean;
}

function inferType(value: unknown): string {
  if (typeof value === 'boolean') return 'bool';
  if (typeof value === 'number') return 'number';
  if (Array.isArray(value)) {
    if (value.length === 0) return 'list(string)';
    const firstType = typeof value[0];
    if (firstType === 'string') return 'list(string)';
    if (firstType === 'number') return 'list(number)';
    return 'list(any)';
  }
  if (value !== null && typeof value === 'object') {
    return 'map(string)';
  }
  return 'string';
}

function valueToHcl(value: unknown, type: string): string {
  if (value === null || value === undefined) return 'null';
  if (type === 'bool') return value ? 'true' : 'false';
  if (type === 'number') return String(value);
  if (type.startsWith('list(')) {
    const items = (value as unknown[]).map(function(v) {
      return '"' + String(v).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
    });
    return '[\n    ' + items.join(',\n    ') + '\n  ]';
  }
  if (type === 'map(string)') {
    const obj = value as Record<string, unknown>;
    const entries = Object.keys(obj).map(function(k) {
      return '    ' + k + ' = "' + String(obj[k]).replace(/"/g, '\\"') + '"';
    });
    return '{\n' + entries.join('\n') + '\n  }';
  }
  if (type.startsWith('object(')) {
    const obj = value as Record<string, unknown>;
    const entries = Object.keys(obj).map(function(k) {
      return '    ' + k + ' = "' + String(obj[k]).replace(/"/g, '\\"') + '"';
    });
    return '{\n' + entries.join('\n') + '\n  }';
  }
  return '"' + String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
}

function objectToTfType(obj: Record<string, unknown>): string {
  const fields = Object.keys(obj).map(function(k) {
    const vtype = inferType(obj[k]);
    return k + ' = ' + vtype;
  });
  return 'object({\n    ' + fields.join('\n    ') + '\n  })';
}

function parseJsonInput(input: string): TfVariable[] {
  const parsed = JSON.parse(input);
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Input must be a JSON object at the top level');
  }
  const obj = parsed as Record<string, unknown>;
  return Object.keys(obj).map(function(key) {
    const val = obj[key];
    let type = inferType(val);
    // For nested objects, use object() type
    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      type = objectToTfType(val as Record<string, unknown>);
    }
    return {
      name: key,
      type: type,
      defaultVal: val,
      description: key.replace(/_/g, ' ').replace(/\b\w/g, function(c) { return c.toUpperCase(); }),
      nullable: false,
    } as TfVariable;
  });
}

function parseKvInput(input: string): TfVariable[] {
  const vars: TfVariable[] = [];
  for (const line of input.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();

    // Auto-detect type
    let type = 'string';
    let defaultVal: string | null = val;

    if (val === 'true' || val === 'false') {
      type = 'bool';
    } else if (val !== '' && !isNaN(Number(val))) {
      type = 'number';
    } else if (val.startsWith('[')) {
      type = 'list(string)';
    } else if (val.startsWith('{')) {
      type = 'map(string)';
    }

    if (val === '') defaultVal = null;

    vars.push({
      name: key,
      type: type,
      defaultVal: defaultVal,
      description: key.replace(/_/g, ' ').replace(/\b\w/g, function(c) { return c.toUpperCase(); }),
      nullable: defaultVal === null,
    });
  }
  return vars;
}

export function parseTfVarsInput(input: string): TfVariable[] {
  const trimmed = input.trim();
  if (trimmed.startsWith('{')) {
    return parseJsonInput(trimmed);
  }
  return parseKvInput(trimmed);
}

export function generateVariablesTf(vars: TfVariable[]): string {
  if (vars.length === 0) return '# No variables defined';
  const blocks: string[] = [];
  for (const v of vars) {
    const lines: string[] = [];
    lines.push('variable "' + v.name + '" {');
    lines.push('  description = "' + v.description + '"');
    lines.push('  type        = ' + v.type);
    if (v.defaultVal !== null) {
      const defaultStr = typeof v.defaultVal === 'object'
        ? valueToHcl(v.defaultVal, v.type)
        : (v.type === 'string'
            ? '"' + String(v.defaultVal).replace(/"/g, '\\"') + '"'
            : String(v.defaultVal));
      lines.push('  default     = ' + defaultStr);
    }
    if (v.nullable) {
      lines.push('  nullable    = true');
    }
    lines.push('}');
    blocks.push(lines.join('\n'));
  }
  return blocks.join('\n\n');
}

export function generateTfvarsFile(vars: TfVariable[]): string {
  if (vars.length === 0) return '# No variables defined';
  const lines: string[] = [];
  for (const v of vars) {
    if (v.defaultVal !== null) {
      const valStr = typeof v.defaultVal === 'object'
        ? valueToHcl(v.defaultVal, v.type)
        : (v.type === 'string'
            ? '"' + String(v.defaultVal).replace(/"/g, '\\"') + '"'
            : String(v.defaultVal));
      lines.push(v.name + ' = ' + valStr);
    } else {
      lines.push('# ' + v.name + ' = <required>');
    }
  }
  return lines.join('\n');
}

export function generateTerraformOutput(input: string): string {
  try {
    const vars = parseTfVarsInput(input);
    const variablesTf = generateVariablesTf(vars);
    const tfvars = generateTfvarsFile(vars);
    return '# variables.tf\n' +
      '# ' + '='.repeat(50) + '\n' +
      variablesTf +
      '\n\n\n' +
      '# terraform.tfvars\n' +
      '# ' + '='.repeat(50) + '\n' +
      tfvars;
  } catch (e: any) {
    return '# Error: ' + e.message;
  }
}

export const TF_VARS_EXAMPLE = `{
  "region": "us-east-1",
  "instance_type": "t3.micro",
  "instance_count": 2,
  "enable_monitoring": true,
  "tags": {
    "Environment": "production",
    "Team": "platform"
  },
  "allowed_cidrs": ["10.0.0.0/8", "172.16.0.0/12"]
}`;
