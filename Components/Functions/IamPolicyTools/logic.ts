// AWS IAM Policy Analyzer — pure TypeScript, no browser APIs

export type IamStatement = {
  Sid?: string;
  Effect: 'Allow' | 'Deny';
  Principal?: string | string[] | Record<string, string | string[]>;
  Action: string | string[];
  Resource: string | string[];
  Condition?: Record<string, unknown>;
};

export type IamPolicy = {
  Version?: string;
  Statement: IamStatement[];
};

export type ActionGroup = {
  service: string;
  actions: string[];
  isWildcard: boolean;
};

export type PolicyWarning = {
  severity: 'critical' | 'high' | 'medium' | 'info';
  message: string;
  statementSid?: string;
};

export type PolicyAnalysis = {
  valid: boolean;
  error?: string;
  statementCount: number;
  allowStatements: number;
  denyStatements: number;
  allowedActionGroups: ActionGroup[];
  deniedActionGroups: ActionGroup[];
  warnings: PolicyWarning[];
  resourceSummary: string[];
  hasPrincipal: boolean;
};

function normalizeActions(action: string | string[]): string[] {
  const arr = Array.isArray(action) ? action : [action];
  return arr.map(function(a) { return a.trim(); });
}

function normalizeResources(resource: string | string[]): string[] {
  const arr = Array.isArray(resource) ? resource : [resource];
  return arr.map(function(r) { return r.trim(); });
}

function groupByService(actions: string[]): ActionGroup[] {
  const map: Record<string, string[]> = {};
  for (let i = 0; i < actions.length; i++) {
    const action = actions[i];
    const colonIdx = action.indexOf(':');
    const service = colonIdx >= 0 ? action.substring(0, colonIdx).toLowerCase() : 'unknown';
    const actionPart = colonIdx >= 0 ? action.substring(colonIdx + 1) : action;
    if (!map[service]) map[service] = [];
    map[service].push(actionPart);
  }
  return Object.keys(map).map(function(service) {
    const acts = map[service];
    const isWildcard = acts.some(function(a) { return a === '*'; });
    return { service, actions: acts, isWildcard };
  });
}

function checkWarnings(statements: IamStatement[]): PolicyWarning[] {
  const warnings: PolicyWarning[] = [];

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    if (stmt.Effect !== 'Allow') continue;

    const actions = normalizeActions(stmt.Action);
    const resources = normalizeResources(stmt.Resource);

    const hasWildcardAction = actions.some(function(a) { return a === '*'; });
    const hasWildcardResource = resources.some(function(r) { return r === '*'; });

    if (hasWildcardAction && hasWildcardResource) {
      warnings.push({
        severity: 'critical',
        message: 'Action: "*" with Resource: "*" grants full admin access — equivalent to AWS root!',
        statementSid: stmt.Sid,
      });
    } else if (hasWildcardAction) {
      warnings.push({
        severity: 'high',
        message: 'Action: "*" allows all AWS API calls on the specified resources.',
        statementSid: stmt.Sid,
      });
    } else if (hasWildcardResource) {
      // Only warn if actions aren't read-only
      const writableActions = actions.filter(function(a) {
        const part = a.toLowerCase();
        return part.includes('*') || part.includes('create') || part.includes('delete') ||
               part.includes('put') || part.includes('write') || part.includes('update') ||
               part.includes('modify') || part.includes('attach') || part.includes('admin');
      });
      if (writableActions.length > 0) {
        warnings.push({
          severity: 'high',
          message: 'Resource: "*" with write/modify actions allows changes to all resources.',
          statementSid: stmt.Sid,
        });
      } else {
        warnings.push({
          severity: 'medium',
          message: 'Resource: "*" grants read access to all resources in specified services.',
          statementSid: stmt.Sid,
        });
      }
    }

    // Check for dangerous services
    const dangerousServices = ['iam', 'sts', 'kms', 'secretsmanager'];
    const serviceGroups = groupByService(actions);
    for (let j = 0; j < serviceGroups.length; j++) {
      const g = serviceGroups[j];
      if (dangerousServices.indexOf(g.service) >= 0) {
        const hasWriteActions = g.actions.some(function(a) {
          return a === '*' || a.toLowerCase().includes('create') || a.toLowerCase().includes('delete') ||
                 a.toLowerCase().includes('put') || a.toLowerCase().includes('attach') ||
                 a.toLowerCase().includes('admin') || a.toLowerCase().includes('passrole');
        });
        if (hasWriteActions) {
          warnings.push({
            severity: 'high',
            message: 'Write access to ' + g.service.toUpperCase() + ' is a high-privilege capability. Review carefully.',
            statementSid: stmt.Sid,
          });
        }
      }
    }

    if (!stmt.Condition) {
      if (hasWildcardResource || hasWildcardAction) {
        warnings.push({
          severity: 'medium',
          message: 'No Condition block — consider adding conditions like aws:RequestedRegion or aws:SourceIp.',
          statementSid: stmt.Sid,
        });
      }
    }
  }

  return warnings;
}

export function analyzeIamPolicy(policyJson: string): PolicyAnalysis {
  let policy: IamPolicy;
  try {
    policy = JSON.parse(policyJson) as IamPolicy;
  } catch (e) {
    return {
      valid: false,
      error: 'Invalid JSON: ' + String(e),
      statementCount: 0,
      allowStatements: 0,
      denyStatements: 0,
      allowedActionGroups: [],
      deniedActionGroups: [],
      warnings: [],
      resourceSummary: [],
      hasPrincipal: false,
    };
  }

  if (!policy || !Array.isArray(policy.Statement)) {
    return {
      valid: false,
      error: 'Policy must have a "Statement" array at the top level',
      statementCount: 0,
      allowStatements: 0,
      denyStatements: 0,
      allowedActionGroups: [],
      deniedActionGroups: [],
      warnings: [],
      resourceSummary: [],
      hasPrincipal: false,
    };
  }

  const statements = policy.Statement;
  const allowStatements = statements.filter(function(s) { return s.Effect === 'Allow'; }).length;
  const denyStatements = statements.filter(function(s) { return s.Effect === 'Deny'; }).length;

  const allAllowedActions: string[] = [];
  const allDeniedActions: string[] = [];
  const allResources: string[] = [];
  let hasPrincipal = false;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const actions = normalizeActions(stmt.Action || []);
    const resources = normalizeResources(stmt.Resource || []);

    if (stmt.Effect === 'Allow') {
      allAllowedActions.push.apply(allAllowedActions, actions);
    } else {
      allDeniedActions.push.apply(allDeniedActions, actions);
    }

    for (let j = 0; j < resources.length; j++) {
      if (allResources.indexOf(resources[j]) < 0) {
        allResources.push(resources[j]);
      }
    }

    if (stmt.Principal) hasPrincipal = true;
  }

  const warnings = checkWarnings(statements);

  return {
    valid: true,
    statementCount: statements.length,
    allowStatements,
    denyStatements,
    allowedActionGroups: groupByService(allAllowedActions),
    deniedActionGroups: groupByService(allDeniedActions),
    warnings,
    resourceSummary: allResources,
    hasPrincipal,
  };
}

export type PolicyTemplate = {
  name: string;
  description: string;
  policy: IamPolicy;
};

export function generateMinimalPolicy(description: string): string {
  const desc = description.toLowerCase().trim();

  // Parse common patterns
  const policies: IamPolicy = {
    Version: '2012-10-17',
    Statement: [],
  };

  if (desc.includes('read') && desc.includes('s3')) {
    const bucket = extractBucketName(desc);
    policies.Statement.push({
      Sid: 'ReadS3Objects',
      Effect: 'Allow',
      Action: ['s3:GetObject', 's3:GetObjectVersion', 's3:ListBucket'],
      Resource: bucket ? ['arn:aws:s3:::' + bucket, 'arn:aws:s3:::' + bucket + '/*'] : ['arn:aws:s3:::your-bucket-name', 'arn:aws:s3:::your-bucket-name/*'],
    });
  } else if ((desc.includes('write') || desc.includes('upload') || desc.includes('put')) && desc.includes('s3')) {
    const bucket = extractBucketName(desc);
    policies.Statement.push({
      Sid: 'WriteS3Objects',
      Effect: 'Allow',
      Action: ['s3:PutObject', 's3:DeleteObject', 's3:GetObject', 's3:ListBucket'],
      Resource: bucket ? ['arn:aws:s3:::' + bucket, 'arn:aws:s3:::' + bucket + '/*'] : ['arn:aws:s3:::your-bucket-name', 'arn:aws:s3:::your-bucket-name/*'],
    });
  } else if (desc.includes('ec2') && desc.includes('read')) {
    policies.Statement.push({
      Sid: 'ReadEC2',
      Effect: 'Allow',
      Action: ['ec2:Describe*', 'ec2:Get*'],
      Resource: '*',
    });
  } else if (desc.includes('cloudwatch') || desc.includes('logs')) {
    policies.Statement.push({
      Sid: 'CloudWatchLogs',
      Effect: 'Allow',
      Action: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents', 'logs:DescribeLogStreams'],
      Resource: 'arn:aws:logs:*:*:*',
    });
  } else if (desc.includes('dynamodb') && desc.includes('read')) {
    policies.Statement.push({
      Sid: 'ReadDynamoDB',
      Effect: 'Allow',
      Action: ['dynamodb:GetItem', 'dynamodb:BatchGetItem', 'dynamodb:Query', 'dynamodb:Scan', 'dynamodb:DescribeTable'],
      Resource: 'arn:aws:dynamodb:*:*:table/your-table-name',
    });
  } else if (desc.includes('lambda') && desc.includes('invoke')) {
    policies.Statement.push({
      Sid: 'InvokeLambda',
      Effect: 'Allow',
      Action: ['lambda:InvokeFunction'],
      Resource: 'arn:aws:lambda:*:*:function:your-function-name',
    });
  } else if (desc.includes('sqs')) {
    policies.Statement.push({
      Sid: 'AccessSQS',
      Effect: 'Allow',
      Action: ['sqs:SendMessage', 'sqs:ReceiveMessage', 'sqs:DeleteMessage', 'sqs:GetQueueAttributes'],
      Resource: 'arn:aws:sqs:*:*:your-queue-name',
    });
  } else if (desc.includes('sns')) {
    policies.Statement.push({
      Sid: 'PublishSNS',
      Effect: 'Allow',
      Action: ['sns:Publish', 'sns:GetTopicAttributes'],
      Resource: 'arn:aws:sns:*:*:your-topic-name',
    });
  } else if (desc.includes('ecr')) {
    policies.Statement.push({
      Sid: 'PullFromECR',
      Effect: 'Allow',
      Action: ['ecr:GetDownloadUrlForLayer', 'ecr:BatchGetImage', 'ecr:GetAuthorizationToken'],
      Resource: '*',
    });
  } else {
    // Generic minimal policy
    policies.Statement.push({
      Sid: 'CustomPolicy',
      Effect: 'Allow',
      Action: ['service:Action'],
      Resource: 'arn:aws:service:region:account-id:resource',
    });
  }

  return JSON.stringify(policies, null, 2);
}

function extractBucketName(desc: string): string {
  // Try to find bucket name after "bucket" keyword
  const match = desc.match(/bucket\s+([a-z0-9][a-z0-9\-\.]{0,61}[a-z0-9])/);
  return match ? match[1] : '';
}

export const EXAMPLE_POLICIES: PolicyTemplate[] = [
  {
    name: 'S3 Read Only',
    description: 'Allow reading objects from a specific S3 bucket',
    policy: {
      Version: '2012-10-17',
      Statement: [{
        Sid: 'ReadS3',
        Effect: 'Allow',
        Action: ['s3:GetObject', 's3:ListBucket'],
        Resource: ['arn:aws:s3:::my-bucket', 'arn:aws:s3:::my-bucket/*'],
      }],
    },
  },
  {
    name: 'Admin (Dangerous)',
    description: 'Full admin access — use only for testing',
    policy: {
      Version: '2012-10-17',
      Statement: [{
        Sid: 'FullAdmin',
        Effect: 'Allow',
        Action: '*',
        Resource: '*',
      }],
    },
  },
  {
    name: 'Lambda + CloudWatch',
    description: 'Minimal policy for a Lambda function to write logs',
    policy: {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'CloudWatchLogs',
          Effect: 'Allow',
          Action: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
          Resource: 'arn:aws:logs:*:*:*',
        },
        {
          Sid: 'ReadS3',
          Effect: 'Allow',
          Action: ['s3:GetObject'],
          Resource: 'arn:aws:s3:::my-config-bucket/*',
        },
      ],
    },
  },
];
