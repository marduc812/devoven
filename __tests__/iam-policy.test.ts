import { analyzeIamPolicy, generateMinimalPolicy } from '@/Components/Functions/IamPolicyTools/logic';

const S3_READ_POLICY = JSON.stringify({
  Version: '2012-10-17',
  Statement: [{
    Sid: 'ReadS3',
    Effect: 'Allow',
    Action: ['s3:GetObject', 's3:ListBucket'],
    Resource: ['arn:aws:s3:::my-bucket', 'arn:aws:s3:::my-bucket/*'],
  }],
});

const ADMIN_POLICY = JSON.stringify({
  Version: '2012-10-17',
  Statement: [{
    Effect: 'Allow',
    Action: '*',
    Resource: '*',
  }],
});

describe('analyzeIamPolicy', () => {
  it('returns valid=false for invalid JSON', () => {
    const result = analyzeIamPolicy('not json');
    expect(result.valid).toBe(false);
    expect(result.error).toBeTruthy();
  });

  it('returns valid=false for missing Statement', () => {
    const result = analyzeIamPolicy('{"Version":"2012-10-17"}');
    expect(result.valid).toBe(false);
  });

  it('parses S3 read policy correctly', () => {
    const result = analyzeIamPolicy(S3_READ_POLICY);
    expect(result.valid).toBe(true);
    expect(result.statementCount).toBe(1);
    expect(result.allowStatements).toBe(1);
    expect(result.denyStatements).toBe(0);
  });

  it('groups actions by service', () => {
    const result = analyzeIamPolicy(S3_READ_POLICY);
    expect(result.allowedActionGroups.some(g => g.service === 's3')).toBe(true);
  });

  it('generates critical warning for wildcard action+resource', () => {
    const result = analyzeIamPolicy(ADMIN_POLICY);
    expect(result.warnings.some(w => w.severity === 'critical')).toBe(true);
  });

  it('detects wildcard action', () => {
    const result = analyzeIamPolicy(ADMIN_POLICY);
    const s3Group = result.allowedActionGroups.find(g => g.service === 'unknown' || g.isWildcard);
    expect(s3Group).toBeTruthy();
  });

  it('handles Deny statements', () => {
    const policy = JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        { Effect: 'Allow', Action: 's3:GetObject', Resource: '*' },
        { Effect: 'Deny', Action: 's3:DeleteObject', Resource: '*' },
      ],
    });
    const result = analyzeIamPolicy(policy);
    expect(result.allowStatements).toBe(1);
    expect(result.denyStatements).toBe(1);
    expect(result.deniedActionGroups.some(g => g.service === 's3')).toBe(true);
  });

  it('collects resource summary', () => {
    const result = analyzeIamPolicy(S3_READ_POLICY);
    expect(result.resourceSummary.length).toBeGreaterThan(0);
    expect(result.resourceSummary.some(r => r.includes('my-bucket'))).toBe(true);
  });

  it('counts statements correctly for multi-statement policy', () => {
    const policy = JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        { Effect: 'Allow', Action: 's3:GetObject', Resource: 'arn:aws:s3:::bucket/*' },
        { Effect: 'Allow', Action: 'logs:PutLogEvents', Resource: 'arn:aws:logs:*' },
        { Effect: 'Deny', Action: 's3:DeleteObject', Resource: 'arn:aws:s3:::bucket/*' },
      ],
    });
    const result = analyzeIamPolicy(policy);
    expect(result.statementCount).toBe(3);
    expect(result.allowStatements).toBe(2);
    expect(result.denyStatements).toBe(1);
  });
});

describe('generateMinimalPolicy', () => {
  it('generates S3 read policy', () => {
    const policy = generateMinimalPolicy('read S3 bucket my-data');
    const parsed = JSON.parse(policy);
    expect(parsed.Version).toBe('2012-10-17');
    expect(Array.isArray(parsed.Statement)).toBe(true);
    expect(parsed.Statement.some((s: { Action: string | string[] }) =>
      Array.isArray(s.Action) && s.Action.includes('s3:GetObject')
    )).toBe(true);
  });

  it('generates CloudWatch logs policy', () => {
    const policy = generateMinimalPolicy('CloudWatch logs');
    const parsed = JSON.parse(policy);
    expect(parsed.Statement.some((s: { Action: string | string[] }) =>
      Array.isArray(s.Action) && s.Action.some((a: string) => a.startsWith('logs:'))
    )).toBe(true);
  });

  it('generates valid JSON', () => {
    const descriptions = ['read S3', 'EC2 read only', 'invoke Lambda', 'send to SQS', 'pull from ECR'];
    for (const desc of descriptions) {
      expect(() => JSON.parse(generateMinimalPolicy(desc))).not.toThrow();
    }
  });

  it('returns generic policy for unrecognized description', () => {
    const policy = generateMinimalPolicy('do something very custom');
    const parsed = JSON.parse(policy);
    expect(Array.isArray(parsed.Statement)).toBe(true);
    expect(parsed.Statement.length).toBeGreaterThan(0);
  });
});
