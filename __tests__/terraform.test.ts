import {
  parseTerraformVarDefs,
  generateTerraformVarBlocks,
  tfvarsToVarFlags,
  varFlagsToTfvars,
  TERRAFORM_EXAMPLE,
} from '../Components/Functions/TerraformTools/logic';

describe('parseTerraformVarDefs', () => {
  it('parses simple key=value as string type', () => {
    const vars = parseTerraformVarDefs('region=us-east-1');
    expect(vars).toHaveLength(1);
    expect(vars[0].name).toBe('region');
    expect(vars[0].type).toBe('string');
    expect(vars[0].defaultVal).toBe('us-east-1');
  });

  it('parses type:default format', () => {
    const vars = parseTerraformVarDefs('count=number:2');
    expect(vars[0].type).toBe('number');
    expect(vars[0].defaultVal).toBe('2');
  });

  it('parses type:default:description format', () => {
    const vars = parseTerraformVarDefs('region=string:us-east-1:AWS region');
    expect(vars[0].type).toBe('string');
    expect(vars[0].defaultVal).toBe('us-east-1');
    expect(vars[0].description).toBe('AWS region');
  });

  it('ignores comment lines', () => {
    const vars = parseTerraformVarDefs('# comment\nfoo=bar');
    expect(vars).toHaveLength(1);
    expect(vars[0].name).toBe('foo');
  });

  it('ignores lines without =', () => {
    const vars = parseTerraformVarDefs('no-equal-sign\nfoo=bar');
    expect(vars).toHaveLength(1);
  });
});

describe('generateTerraformVarBlocks', () => {
  it('generates variable block with type', () => {
    const out = generateTerraformVarBlocks('region=string:us-east-1:AWS region');
    expect(out).toContain('variable "region"');
    expect(out).toContain('type = string');
    expect(out).toContain('default = "us-east-1"');
    expect(out).toContain('description = "AWS region"');
  });

  it('does not quote number type defaults', () => {
    const out = generateTerraformVarBlocks('count=number:3:Instance count');
    expect(out).toContain('default = 3');
    expect(out).not.toContain('default = "3"');
  });

  it('does not quote bool type defaults', () => {
    const out = generateTerraformVarBlocks('enabled=bool:true:Enable feature');
    expect(out).toContain('default = true');
  });

  it('generates multiple variables', () => {
    const out = generateTerraformVarBlocks('a=string:x:desc\nb=number:5:count');
    expect(out).toContain('variable "a"');
    expect(out).toContain('variable "b"');
  });

  it('returns placeholder comment for empty input', () => {
    const out = generateTerraformVarBlocks('');
    expect(out).toContain('# No variables');
  });

  it('generates full example without error', () => {
    const out = generateTerraformVarBlocks(TERRAFORM_EXAMPLE);
    expect(out).toContain('variable "region"');
    expect(out).toContain('variable "enable_monitoring"');
  });
});

describe('tfvarsToVarFlags', () => {
  it('converts .tfvars to -var flags', () => {
    const out = tfvarsToVarFlags('region = "us-east-1"\nenv = "staging"');
    expect(out).toContain('-var "region=us-east-1"');
    expect(out).toContain('-var "env=staging"');
  });

  it('ignores comment lines', () => {
    const out = tfvarsToVarFlags('# comment\nfoo = "bar"');
    expect(out).toContain('-var "foo=bar"');
    expect(out).not.toContain('comment');
  });

  it('returns empty string for empty input', () => {
    expect(tfvarsToVarFlags('')).toBe('');
  });
});

describe('varFlagsToTfvars', () => {
  it('converts -var flags to .tfvars', () => {
    const out = varFlagsToTfvars('-var "region=us-east-1" -var "env=staging"');
    expect(out).toContain('region = "us-east-1"');
    expect(out).toContain('env = "staging"');
  });

  it('handles multiline input', () => {
    const out = varFlagsToTfvars('-var "a=1" \\\n  -var "b=2"');
    expect(out).toContain('a = "1"');
    expect(out).toContain('b = "2"');
  });

  it('returns empty string for no matches', () => {
    expect(varFlagsToTfvars('no flags here')).toBe('');
  });
});
