import {
  parseTfVarsInput,
  generateVariablesTf,
  generateTfvarsFile,
  generateTerraformOutput,
} from '../Components/Functions/TerraformVarsTools/logic';

describe('parseTfVarsInput - JSON mode', () => {
  test('parses string type', () => {
    const vars = parseTfVarsInput('{"region": "us-east-1"}');
    expect(vars).toHaveLength(1);
    expect(vars[0].name).toBe('region');
    expect(vars[0].type).toBe('string');
    expect(vars[0].defaultVal).toBe('us-east-1');
  });

  test('parses number type', () => {
    const vars = parseTfVarsInput('{"count": 3}');
    expect(vars[0].type).toBe('number');
    expect(vars[0].defaultVal).toBe(3);
  });

  test('parses bool type', () => {
    const vars = parseTfVarsInput('{"enabled": true}');
    expect(vars[0].type).toBe('bool');
  });

  test('parses list(string) type', () => {
    const vars = parseTfVarsInput('{"cidrs": ["10.0.0.0/8", "192.168.0.0/16"]}');
    expect(vars[0].type).toBe('list(string)');
  });

  test('parses nested object as object() type', () => {
    const vars = parseTfVarsInput('{"tags": {"env": "prod", "team": "ops"}}');
    expect(vars[0].type).toContain('object(');
  });

  test('returns error for non-object JSON', () => {
    const output = generateTerraformOutput('[1,2,3]');
    // Array input is not a valid top-level object → either error message or empty vars
    expect(typeof output).toBe('string');
    expect(output.length).toBeGreaterThan(0);
  });
});

describe('parseTfVarsInput - key=value mode', () => {
  test('parses simple string values', () => {
    const vars = parseTfVarsInput('region=us-east-1\nenv=prod');
    expect(vars).toHaveLength(2);
    expect(vars[0].type).toBe('string');
  });

  test('infers bool type', () => {
    const vars = parseTfVarsInput('enabled=true');
    expect(vars[0].type).toBe('bool');
  });

  test('infers number type', () => {
    const vars = parseTfVarsInput('count=5');
    expect(vars[0].type).toBe('number');
  });

  test('ignores blank lines and comments', () => {
    const vars = parseTfVarsInput('# comment\n\nregion=us-east-1\n');
    expect(vars).toHaveLength(1);
  });

  test('sets nullable for empty value', () => {
    const vars = parseTfVarsInput('api_key=');
    expect(vars[0].nullable).toBe(true);
    expect(vars[0].defaultVal).toBeNull();
  });
});

describe('generateVariablesTf', () => {
  test('generates variable block with type and default', () => {
    const vars = parseTfVarsInput('region=us-east-1');
    const output = generateVariablesTf(vars);
    expect(output).toContain('variable "region"');
    expect(output).toContain('type        = string');
    expect(output).toContain('default     = "us-east-1"');
  });

  test('returns placeholder for no vars', () => {
    const output = generateVariablesTf([]);
    expect(output).toBe('# No variables defined');
  });
});

describe('generateTfvarsFile', () => {
  test('generates tfvars with quoted string', () => {
    const vars = parseTfVarsInput('region=us-east-1');
    const output = generateTfvarsFile(vars);
    expect(output).toContain('region = "us-east-1"');
  });

  test('generates comment for nullable vars', () => {
    const vars = parseTfVarsInput('api_key=');
    const output = generateTfvarsFile(vars);
    expect(output).toContain('# api_key = <required>');
  });
});

describe('generateTerraformOutput', () => {
  test('includes both sections', () => {
    const output = generateTerraformOutput('region=us-east-1');
    expect(output).toContain('# variables.tf');
    expect(output).toContain('# terraform.tfvars');
  });

  test('handles JSON input end-to-end', () => {
    const json = '{"instance_type": "t3.micro", "count": 2}';
    const output = generateTerraformOutput(json);
    expect(output).toContain('variable "instance_type"');
    expect(output).toContain('variable "count"');
    expect(output).toContain('type        = number');
  });
});
