// ── CI/CD Pipeline Generator ────────────────────────────────────────────────────

export type ProjectType = 'node' | 'python' | 'go' | 'rust' | 'docker' | 'generic';
export type CiPlatform = 'github-actions' | 'gitlab-ci' | 'circleci';

export interface PipelineOptions {
  projectName: string;
  projectType: ProjectType;
  platform: CiPlatform;
  steps: string[];  // e.g. ['install', 'lint', 'test', 'build', 'deploy']
  nodeVersion: string;
  pythonVersion: string;
  goVersion: string;
  rustVersion: string;
  deployTarget: string; // e.g. 's3', 'ecr', 'gcs', 'heroku', ''
  branch: string;
  dockerImage: string;
  testCommand: string;
  buildCommand: string;
  deployCommand: string;
}

const DEFAULTS: PipelineOptions = {
  projectName: 'my-project',
  projectType: 'node',
  platform: 'github-actions',
  steps: ['install', 'test', 'build'],
  nodeVersion: '20',
  pythonVersion: '3.11',
  goVersion: '1.21',
  rustVersion: 'stable',
  deployTarget: '',
  branch: 'main',
  dockerImage: 'ubuntu-latest',
  testCommand: '',
  buildCommand: '',
  deployCommand: '',
};

export function parsePipelineInput(input: string, platform: CiPlatform, projectType: ProjectType): PipelineOptions {
  const opts: PipelineOptions = Object.assign({}, DEFAULTS, { platform, projectType });

  for (const line of input.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim().toLowerCase().replace(/-/g, '_');
    const val = trimmed.slice(eqIdx + 1).trim();
    switch (key) {
      case 'project_name': case 'name': opts.projectName = val; break;
      case 'node_version': opts.nodeVersion = val; break;
      case 'python_version': opts.pythonVersion = val; break;
      case 'go_version': opts.goVersion = val; break;
      case 'rust_version': opts.rustVersion = val; break;
      case 'deploy_target': case 'deploy': opts.deployTarget = val; break;
      case 'branch': opts.branch = val; break;
      case 'docker_image': opts.dockerImage = val; break;
      case 'test_command': opts.testCommand = val; break;
      case 'build_command': opts.buildCommand = val; break;
      case 'deploy_command': opts.deployCommand = val; break;
      case 'steps': opts.steps = val.split(',').map(function(s) { return s.trim().toLowerCase(); }); break;
      default: break;
    }
  }
  return opts;
}

// ── GitHub Actions Generator ───────────────────────────────────────────────────

function getNodeSteps(opts: PipelineOptions): string[] {
  const lines: string[] = [];
  lines.push('      - name: Setup Node.js');
  lines.push('        uses: actions/setup-node@v4');
  lines.push('        with:');
  lines.push('          node-version: \'' + opts.nodeVersion + '\'');
  lines.push('          cache: \'npm\'');

  if (opts.steps.indexOf('install') !== -1) {
    lines.push('');
    lines.push('      - name: Install dependencies');
    lines.push('        run: npm ci');
  }
  if (opts.steps.indexOf('lint') !== -1) {
    lines.push('');
    lines.push('      - name: Lint');
    lines.push('        run: npm run lint');
  }
  if (opts.steps.indexOf('test') !== -1) {
    const cmd = opts.testCommand || 'npm test';
    lines.push('');
    lines.push('      - name: Test');
    lines.push('        run: ' + cmd);
  }
  if (opts.steps.indexOf('build') !== -1) {
    const cmd = opts.buildCommand || 'npm run build';
    lines.push('');
    lines.push('      - name: Build');
    lines.push('        run: ' + cmd);
  }
  return lines;
}

function getPythonSteps(opts: PipelineOptions): string[] {
  const lines: string[] = [];
  lines.push('      - name: Setup Python');
  lines.push('        uses: actions/setup-python@v5');
  lines.push('        with:');
  lines.push('          python-version: \'' + opts.pythonVersion + '\'');

  lines.push('');
  lines.push('      - name: Cache pip');
  lines.push('        uses: actions/cache@v4');
  lines.push('        with:');
  lines.push('          path: ~/.cache/pip');
  lines.push('          key: ${{ runner.os }}-pip-${{ hashFiles(\'requirements*.txt\') }}');

  if (opts.steps.indexOf('install') !== -1) {
    lines.push('');
    lines.push('      - name: Install dependencies');
    lines.push('        run: |');
    lines.push('          python -m pip install --upgrade pip');
    lines.push('          pip install -r requirements.txt');
  }
  if (opts.steps.indexOf('lint') !== -1) {
    lines.push('');
    lines.push('      - name: Lint');
    lines.push('        run: |');
    lines.push('          pip install flake8');
    lines.push('          flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics');
  }
  if (opts.steps.indexOf('test') !== -1) {
    const cmd = opts.testCommand || 'pytest';
    lines.push('');
    lines.push('      - name: Test');
    lines.push('        run: ' + cmd);
  }
  if (opts.steps.indexOf('build') !== -1) {
    const cmd = opts.buildCommand || 'python setup.py build';
    lines.push('');
    lines.push('      - name: Build');
    lines.push('        run: ' + cmd);
  }
  return lines;
}

function getGoSteps(opts: PipelineOptions): string[] {
  const lines: string[] = [];
  lines.push('      - name: Setup Go');
  lines.push('        uses: actions/setup-go@v5');
  lines.push('        with:');
  lines.push('          go-version: \'' + opts.goVersion + '\'');
  lines.push('          cache: true');

  if (opts.steps.indexOf('install') !== -1) {
    lines.push('');
    lines.push('      - name: Download modules');
    lines.push('        run: go mod download');
  }
  if (opts.steps.indexOf('lint') !== -1) {
    lines.push('');
    lines.push('      - name: Lint');
    lines.push('        uses: golangci/golangci-lint-action@v4');
  }
  if (opts.steps.indexOf('test') !== -1) {
    const cmd = opts.testCommand || 'go test ./... -v -race';
    lines.push('');
    lines.push('      - name: Test');
    lines.push('        run: ' + cmd);
  }
  if (opts.steps.indexOf('build') !== -1) {
    const cmd = opts.buildCommand || 'go build -v ./...';
    lines.push('');
    lines.push('      - name: Build');
    lines.push('        run: ' + cmd);
  }
  return lines;
}

function getRustSteps(opts: PipelineOptions): string[] {
  const lines: string[] = [];
  lines.push('      - name: Setup Rust');
  lines.push('        uses: dtolnay/rust-toolchain@' + opts.rustVersion);

  lines.push('');
  lines.push('      - name: Cache Cargo');
  lines.push('        uses: Swatinem/rust-cache@v2');

  if (opts.steps.indexOf('lint') !== -1) {
    lines.push('');
    lines.push('      - name: Clippy');
    lines.push('        run: cargo clippy -- -D warnings');
  }
  if (opts.steps.indexOf('test') !== -1) {
    const cmd = opts.testCommand || 'cargo test';
    lines.push('');
    lines.push('      - name: Test');
    lines.push('        run: ' + cmd);
  }
  if (opts.steps.indexOf('build') !== -1) {
    const cmd = opts.buildCommand || 'cargo build --release';
    lines.push('');
    lines.push('      - name: Build');
    lines.push('        run: ' + cmd);
  }
  return lines;
}

function getDockerSteps(opts: PipelineOptions): string[] {
  const lines: string[] = [];
  lines.push('      - name: Set up Docker Buildx');
  lines.push('        uses: docker/setup-buildx-action@v3');

  if (opts.steps.indexOf('build') !== -1) {
    lines.push('');
    lines.push('      - name: Build Docker image');
    lines.push('        run: docker build -t ' + opts.projectName + ':${{ github.sha }} .');
  }
  if (opts.steps.indexOf('test') !== -1) {
    const cmd = opts.testCommand || 'docker run --rm ' + opts.projectName + ':${{ github.sha }} npm test';
    lines.push('');
    lines.push('      - name: Test');
    lines.push('        run: ' + cmd);
  }
  return lines;
}

function getDeploySteps(opts: PipelineOptions): string[] {
  const lines: string[] = [];
  if (!opts.steps.includes('deploy') && !opts.deployTarget) return lines;

  lines.push('');
  lines.push('      # Deploy step');
  if (opts.deployCommand) {
    lines.push('      - name: Deploy');
    lines.push('        run: ' + opts.deployCommand);
  } else if (opts.deployTarget === 's3') {
    lines.push('      - name: Deploy to S3');
    lines.push('        run: aws s3 sync ./build s3://your-bucket --delete');
    lines.push('        env:');
    lines.push('          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}');
    lines.push('          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}');
  } else if (opts.deployTarget === 'ecr' || opts.deployTarget === 'ecs') {
    lines.push('      - name: Login to ECR');
    lines.push('        uses: aws-actions/amazon-ecr-login@v2');
    lines.push('');
    lines.push('      - name: Push to ECR');
    lines.push('        run: |');
    lines.push('          docker tag ' + opts.projectName + ':${{ github.sha }} ${{ secrets.ECR_REGISTRY }}/' + opts.projectName + ':${{ github.sha }}');
    lines.push('          docker push ${{ secrets.ECR_REGISTRY }}/' + opts.projectName + ':${{ github.sha }}');
  } else if (opts.deployTarget === 'heroku') {
    lines.push('      - name: Deploy to Heroku');
    lines.push('        uses: akhileshns/heroku-deploy@v3.12.14');
    lines.push('        with:');
    lines.push('          heroku_api_key: ${{ secrets.HEROKU_API_KEY }}');
    lines.push('          heroku_app_name: ' + opts.projectName);
    lines.push('          heroku_email: ${{ secrets.HEROKU_EMAIL }}');
  } else if (opts.deployTarget === 'gcs') {
    lines.push('      - name: Deploy to GCS');
    lines.push('        run: gsutil -m rsync -r ./build gs://your-bucket');
    lines.push('        env:');
    lines.push('          GOOGLE_APPLICATION_CREDENTIALS: ${{ secrets.GCP_SA_KEY }}');
  } else {
    lines.push('      - name: Deploy');
    lines.push('        run: echo "Add your deploy command here"');
  }
  return lines;
}

function generateGitHubActions(opts: PipelineOptions): string {
  const lines: string[] = [];
  lines.push('name: ' + opts.projectName + ' CI/CD');
  lines.push('');
  lines.push('on:');
  lines.push('  push:');
  lines.push('    branches: [\'' + opts.branch + '\']');
  lines.push('  pull_request:');
  lines.push('    branches: [\'' + opts.branch + '\']');
  lines.push('');
  lines.push('jobs:');
  lines.push('  build:');
  lines.push('    runs-on: ' + opts.dockerImage);
  lines.push('');
  lines.push('    steps:');
  lines.push('      - name: Checkout');
  lines.push('        uses: actions/checkout@v4');
  lines.push('');

  let projectSteps: string[] = [];
  switch (opts.projectType) {
    case 'node': projectSteps = getNodeSteps(opts); break;
    case 'python': projectSteps = getPythonSteps(opts); break;
    case 'go': projectSteps = getGoSteps(opts); break;
    case 'rust': projectSteps = getRustSteps(opts); break;
    case 'docker': projectSteps = getDockerSteps(opts); break;
    default: {
      if (opts.steps.indexOf('test') !== -1) {
        projectSteps.push('      - name: Test');
        projectSteps.push('        run: ' + (opts.testCommand || 'make test'));
      }
      if (opts.steps.indexOf('build') !== -1) {
        projectSteps.push('      - name: Build');
        projectSteps.push('        run: ' + (opts.buildCommand || 'make build'));
      }
    }
  }

  lines.push(...projectSteps);
  lines.push(...getDeploySteps(opts));

  return lines.join('\n');
}

// ── GitLab CI Generator ────────────────────────────────────────────────────────

function generateGitLabCI(opts: PipelineOptions): string {
  const lines: string[] = [];

  let image = 'ubuntu:latest';
  if (opts.projectType === 'node') image = 'node:' + opts.nodeVersion;
  else if (opts.projectType === 'python') image = 'python:' + opts.pythonVersion;
  else if (opts.projectType === 'go') image = 'golang:' + opts.goVersion;

  lines.push('image: ' + image);
  lines.push('');
  lines.push('stages:');

  const stages: string[] = [];
  if (opts.steps.indexOf('install') !== -1) stages.push('  - install');
  if (opts.steps.indexOf('lint') !== -1) stages.push('  - lint');
  if (opts.steps.indexOf('test') !== -1) stages.push('  - test');
  if (opts.steps.indexOf('build') !== -1) stages.push('  - build');
  if (opts.steps.indexOf('deploy') !== -1 || opts.deployTarget) stages.push('  - deploy');
  if (stages.length === 0) stages.push('  - build');
  lines.push(...stages);

  lines.push('');
  lines.push('variables:');
  lines.push('  PROJECT_NAME: ' + opts.projectName);

  if (opts.steps.indexOf('install') !== -1) {
    lines.push('');
    lines.push('install:');
    lines.push('  stage: install');
    if (opts.projectType === 'node') {
      lines.push('  script:');
      lines.push('    - npm ci');
      lines.push('  cache:');
      lines.push('    paths:');
      lines.push('      - node_modules/');
    } else if (opts.projectType === 'python') {
      lines.push('  script:');
      lines.push('    - pip install -r requirements.txt');
    } else {
      lines.push('  script:');
      lines.push('    - echo "Install step"');
    }
  }

  if (opts.steps.indexOf('test') !== -1) {
    lines.push('');
    lines.push('test:');
    lines.push('  stage: test');
    lines.push('  script:');
    const cmd = opts.testCommand
      || (opts.projectType === 'node' ? 'npm test'
        : opts.projectType === 'python' ? 'pytest'
        : opts.projectType === 'go' ? 'go test ./...'
        : 'make test');
    lines.push('    - ' + cmd);
  }

  if (opts.steps.indexOf('build') !== -1) {
    lines.push('');
    lines.push('build:');
    lines.push('  stage: build');
    lines.push('  script:');
    const cmd = opts.buildCommand
      || (opts.projectType === 'node' ? 'npm run build'
        : opts.projectType === 'go' ? 'go build ./...'
        : opts.projectType === 'rust' ? 'cargo build --release'
        : 'make build');
    lines.push('    - ' + cmd);
    lines.push('  artifacts:');
    lines.push('    paths:');
    lines.push('      - dist/');
    lines.push('    expire_in: 1 week');
  }

  if (opts.steps.indexOf('deploy') !== -1 || opts.deployTarget) {
    lines.push('');
    lines.push('deploy:');
    lines.push('  stage: deploy');
    lines.push('  script:');
    const cmd = opts.deployCommand || 'echo "Add deploy command"';
    lines.push('    - ' + cmd);
    lines.push('  only:');
    lines.push('    - ' + opts.branch);
  }

  return lines.join('\n');
}

// ── CircleCI Generator ────────────────────────────────────────────────────────

function generateCircleCI(opts: PipelineOptions): string {
  const lines: string[] = [];
  lines.push('version: 2.1');
  lines.push('');

  let dockerImg = 'cimg/base:stable';
  if (opts.projectType === 'node') dockerImg = 'cimg/node:' + opts.nodeVersion;
  else if (opts.projectType === 'python') dockerImg = 'cimg/python:' + opts.pythonVersion;
  else if (opts.projectType === 'go') dockerImg = 'cimg/go:' + opts.goVersion;
  else if (opts.projectType === 'rust') dockerImg = 'cimg/rust:' + opts.rustVersion;

  lines.push('jobs:');
  lines.push('  build-and-test:');
  lines.push('    docker:');
  lines.push('      - image: ' + dockerImg);
  lines.push('    steps:');
  lines.push('      - checkout');

  if (opts.projectType === 'node') {
    if (opts.steps.indexOf('install') !== -1) {
      lines.push('      - restore_cache:');
      lines.push('          keys:');
      lines.push('            - node-deps-{{ checksum "package-lock.json" }}');
      lines.push('      - run:');
      lines.push('          name: Install dependencies');
      lines.push('          command: npm ci');
      lines.push('      - save_cache:');
      lines.push('          key: node-deps-{{ checksum "package-lock.json" }}');
      lines.push('          paths:');
      lines.push('            - node_modules');
    }
    if (opts.steps.indexOf('test') !== -1) {
      lines.push('      - run:');
      lines.push('          name: Test');
      lines.push('          command: ' + (opts.testCommand || 'npm test'));
    }
    if (opts.steps.indexOf('build') !== -1) {
      lines.push('      - run:');
      lines.push('          name: Build');
      lines.push('          command: ' + (opts.buildCommand || 'npm run build'));
    }
  } else {
    if (opts.steps.indexOf('test') !== -1) {
      lines.push('      - run:');
      lines.push('          name: Test');
      lines.push('          command: ' + (opts.testCommand || 'make test'));
    }
    if (opts.steps.indexOf('build') !== -1) {
      lines.push('      - run:');
      lines.push('          name: Build');
      lines.push('          command: ' + (opts.buildCommand || 'make build'));
    }
  }

  lines.push('');
  lines.push('workflows:');
  lines.push('  version: 2');
  lines.push('  build-deploy:');
  lines.push('    jobs:');
  lines.push('      - build-and-test');

  return lines.join('\n');
}

export function generatePipeline(input: string, platform: CiPlatform, projectType: ProjectType): string {
  const opts = parsePipelineInput(input, platform, projectType);
  switch (platform) {
    case 'github-actions': return generateGitHubActions(opts);
    case 'gitlab-ci': return generateGitLabCI(opts);
    case 'circleci': return generateCircleCI(opts);
    default: return generateGitHubActions(opts);
  }
}

export const CICD_GEN_EXAMPLE = `project_name=my-web-app
branch=main
deploy_target=s3
steps=install,lint,test,build,deploy`;

export const PLATFORM_LABELS: Record<CiPlatform, string> = {
  'github-actions': 'GitHub Actions',
  'gitlab-ci': 'GitLab CI',
  'circleci': 'CircleCI',
};

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  node: 'Node.js',
  python: 'Python',
  go: 'Go',
  rust: 'Rust',
  docker: 'Docker',
  generic: 'Generic',
};
