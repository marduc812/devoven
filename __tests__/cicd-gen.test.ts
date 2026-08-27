import {
  generatePipeline,
  parsePipelineInput,
  CiPlatform,
  ProjectType,
} from '../Components/Functions/CicdGenTools/logic';

describe('parsePipelineInput', () => {
  test('parses project name', () => {
    const opts = parsePipelineInput('project_name=my-app', 'github-actions', 'node');
    expect(opts.projectName).toBe('my-app');
  });

  test('parses branch', () => {
    const opts = parsePipelineInput('branch=develop', 'github-actions', 'node');
    expect(opts.branch).toBe('develop');
  });

  test('parses steps as comma-separated list', () => {
    const opts = parsePipelineInput('steps=install,test,build,deploy', 'github-actions', 'node');
    expect(opts.steps).toEqual(['install', 'test', 'build', 'deploy']);
  });

  test('parses deploy target', () => {
    const opts = parsePipelineInput('deploy_target=s3', 'github-actions', 'node');
    expect(opts.deployTarget).toBe('s3');
  });

  test('ignores comments and blank lines', () => {
    const opts = parsePipelineInput('# comment\n\nproject_name=test', 'github-actions', 'node');
    expect(opts.projectName).toBe('test');
  });

  test('platform and projectType are set from args', () => {
    const opts = parsePipelineInput('', 'gitlab-ci', 'python');
    expect(opts.platform).toBe('gitlab-ci');
    expect(opts.projectType).toBe('python');
  });
});

describe('generatePipeline - GitHub Actions', () => {
  test('generates workflow name', () => {
    const output = generatePipeline('project_name=my-app', 'github-actions', 'node');
    expect(output).toContain('name: my-app CI/CD');
  });

  test('includes checkout step', () => {
    const output = generatePipeline('', 'github-actions', 'node');
    expect(output).toContain('actions/checkout@v4');
  });

  test('includes node setup for node projects', () => {
    const output = generatePipeline('', 'github-actions', 'node');
    expect(output).toContain('actions/setup-node@v4');
  });

  test('includes python setup for python projects', () => {
    const output = generatePipeline('', 'github-actions', 'python');
    expect(output).toContain('actions/setup-python@v5');
  });

  test('includes go setup for go projects', () => {
    const output = generatePipeline('', 'github-actions', 'go');
    expect(output).toContain('actions/setup-go@v5');
  });

  test('includes rust toolchain for rust projects', () => {
    const output = generatePipeline('', 'github-actions', 'rust');
    expect(output).toContain('dtolnay/rust-toolchain@');
  });

  test('includes docker buildx for docker projects', () => {
    const output = generatePipeline('', 'github-actions', 'docker');
    expect(output).toContain('docker/setup-buildx-action@v3');
  });

  test('includes test step when steps contain test', () => {
    const output = generatePipeline('steps=install,test,build', 'github-actions', 'node');
    expect(output).toContain('name: Test');
    expect(output).toContain('npm test');
  });

  test('includes deploy step for S3 when deploy_target set', () => {
    const output = generatePipeline('steps=install,test,build,deploy\ndeploy_target=s3', 'github-actions', 'node');
    expect(output).toContain('aws s3 sync');
  });

  test('respects branch name', () => {
    const output = generatePipeline('branch=release', 'github-actions', 'node');
    expect(output).toContain('release');
  });
});

describe('generatePipeline - GitLab CI', () => {
  test('starts with image:', () => {
    const output = generatePipeline('', 'gitlab-ci', 'node');
    expect(output).toContain('image:');
  });

  test('includes stages section', () => {
    const output = generatePipeline('steps=test,build', 'gitlab-ci', 'node');
    expect(output).toContain('stages:');
    expect(output).toContain('- test');
    expect(output).toContain('- build');
  });

  test('includes test job', () => {
    const output = generatePipeline('steps=test', 'gitlab-ci', 'node');
    expect(output).toContain('\ntest:');
    expect(output).toContain('npm test');
  });
});

describe('generatePipeline - CircleCI', () => {
  test('starts with version: 2.1', () => {
    const output = generatePipeline('', 'circleci', 'node');
    expect(output).toContain('version: 2.1');
  });

  test('includes jobs section', () => {
    const output = generatePipeline('', 'circleci', 'node');
    expect(output).toContain('jobs:');
    expect(output).toContain('build-and-test:');
  });

  test('includes workflows section', () => {
    const output = generatePipeline('', 'circleci', 'node');
    expect(output).toContain('workflows:');
  });

  test('uses correct docker image for python', () => {
    const output = generatePipeline('python_version=3.11', 'circleci', 'python');
    expect(output).toContain('cimg/python:3.11');
  });
});

describe('generatePipeline - project types', () => {
  const platforms: CiPlatform[] = ['github-actions', 'gitlab-ci', 'circleci'];
  const projectTypes: ProjectType[] = ['node', 'python', 'go', 'rust', 'docker', 'generic'];

  for (const platform of platforms) {
    for (const projectType of projectTypes) {
      test(platform + ' + ' + projectType + ' produces non-empty output', () => {
        const output = generatePipeline('steps=install,test,build', platform, projectType);
        expect(output.length).toBeGreaterThan(50);
      });
    }
  }
});
