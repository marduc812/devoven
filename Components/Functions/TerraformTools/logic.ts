// ── Terraform Variable Generator ──────────────────────────────────────────────

export interface TerraformVarDef {
  name: string;
  type: string;
  defaultVal: string;
  description: string;
}

/**
 * Parse variable definitions from input lines.
 * Formats supported:
 *   name=value               → type=string, default=value
 *   name=type:default:description → full spec
 */
export function parseTerraformVarDefs(input: string): TerraformVarDef[] {
  const vars: TerraformVarDef[] = [];
  const lines = input.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;

    const name = trimmed.slice(0, eqIdx).trim();
    const rest = trimmed.slice(eqIdx + 1).trim();

    // Check if rest is type:default:description
    const parts = rest.split(':');
    if (parts.length >= 3) {
      vars.push({
        name: name,
        type: parts[0].trim() || 'string',
        defaultVal: parts[1].trim(),
        description: parts.slice(2).join(':').trim(),
      });
    } else if (parts.length === 2) {
      vars.push({
        name: name,
        type: parts[0].trim() || 'string',
        defaultVal: parts[1].trim(),
        description: '',
      });
    } else {
      // Simple key=value → type=string, default=value
      vars.push({
        name: name,
        type: 'string',
        defaultVal: rest,
        description: '',
      });
    }
  }
  return vars;
}

export function generateTerraformVarBlocks(input: string): string {
  const vars = parseTerraformVarDefs(input);
  if (vars.length === 0) return '# No variables defined';

  const blocks: string[] = [];
  for (const v of vars) {
    const lines: string[] = [];
    lines.push('variable "' + v.name + '" {');
    lines.push('  type = ' + v.type);
    if (v.description) {
      lines.push('  description = "' + v.description.replace(/"/g, '\\"') + '"');
    }
    if (v.defaultVal !== '') {
      const typeStr = v.type.toLowerCase();
      const isString = typeStr === 'string' || typeStr === 'any';
      const isBool = typeStr === 'bool';
      const isNumber = typeStr === 'number';
      if (isNumber) {
        lines.push('  default = ' + v.defaultVal);
      } else if (isBool) {
        lines.push('  default = ' + v.defaultVal);
      } else if (!isString && (v.defaultVal.startsWith('[') || v.defaultVal.startsWith('{'))) {
        lines.push('  default = ' + v.defaultVal);
      } else {
        lines.push('  default = "' + v.defaultVal + '"');
      }
    }
    lines.push('}');
    blocks.push(lines.join('\n'));
  }
  return blocks.join('\n\n');
}

/**
 * Convert .tfvars content (key = "value" format) to -var flag CLI string.
 */
export function tfvarsToVarFlags(tfvars: string): string {
  const parts: string[] = [];
  const lines = tfvars.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^"(.*)"$/, '$1');
    parts.push('-var "' + key + '=' + val + '"');
  }
  return parts.join(' \\\n  ');
}

/**
 * Convert -var flag CLI string to .tfvars format.
 */
export function varFlagsToTfvars(flags: string): string {
  const lines: string[] = [];
  // Match -var "key=value" patterns
  const re = /-var\s+"([^"=]+)=([^"]*)"/g;
  let m = re.exec(flags);
  while (m !== null) {
    lines.push(m[1] + ' = "' + m[2] + '"');
    m = re.exec(flags);
  }
  return lines.join('\n');
}

export const TERRAFORM_EXAMPLE = `region=string:us-east-1:AWS region to deploy into
instance_type=string:t3.micro:EC2 instance type
enable_monitoring=bool:true:Enable CloudWatch monitoring
instance_count=number:2:Number of instances to create
environment=staging`;
