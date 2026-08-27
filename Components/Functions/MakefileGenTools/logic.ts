// Makefile Generator — pure TypeScript, no browser APIs
// Generates Makefiles from project type + target descriptions

export type ProjectType = 'node' | 'python' | 'go' | 'rust' | 'docker' | 'generic';

export interface MakeTarget {
  name: string;
  deps: string[];
  commands: string[];
  description: string;
  phony: boolean;
}

export interface MakefileResult {
  content: string;
  targets: string[];
  warnings: string[];
}

// Common target definitions per project type
const TARGET_DEFS: Record<ProjectType, Record<string, MakeTarget>> = {
  node: {
    install: {
      name: 'install',
      deps: [],
      commands: ['npm install'],
      description: 'Install Node.js dependencies',
      phony: true,
    },
    build: {
      name: 'build',
      deps: ['install'],
      commands: ['npm run build'],
      description: 'Build the project',
      phony: true,
    },
    test: {
      name: 'test',
      deps: [],
      commands: ['npm test'],
      description: 'Run test suite',
      phony: true,
    },
    lint: {
      name: 'lint',
      deps: [],
      commands: ['npm run lint'],
      description: 'Run linter',
      phony: true,
    },
    format: {
      name: 'format',
      deps: [],
      commands: ['npm run format'],
      description: 'Format source code',
      phony: true,
    },
    dev: {
      name: 'dev',
      deps: [],
      commands: ['npm run dev'],
      description: 'Start development server',
      phony: true,
    },
    start: {
      name: 'start',
      deps: [],
      commands: ['npm start'],
      description: 'Start production server',
      phony: true,
    },
    clean: {
      name: 'clean',
      deps: [],
      commands: ['rm -rf node_modules dist build .next out'],
      description: 'Remove build artifacts and dependencies',
      phony: true,
    },
    ci: {
      name: 'ci',
      deps: ['install', 'lint', 'test', 'build'],
      commands: [],
      description: 'Run full CI pipeline',
      phony: true,
    },
    publish: {
      name: 'publish',
      deps: ['build'],
      commands: ['npm publish'],
      description: 'Publish package to npm registry',
      phony: true,
    },
  },
  python: {
    install: {
      name: 'install',
      deps: [],
      commands: ['pip install -r requirements.txt'],
      description: 'Install Python dependencies',
      phony: true,
    },
    venv: {
      name: 'venv',
      deps: [],
      commands: ['python3 -m venv .venv', 'echo "Activate with: source .venv/bin/activate"'],
      description: 'Create virtual environment',
      phony: true,
    },
    test: {
      name: 'test',
      deps: [],
      commands: ['python -m pytest tests/ -v'],
      description: 'Run test suite with pytest',
      phony: true,
    },
    lint: {
      name: 'lint',
      deps: [],
      commands: ['flake8 .', 'mypy .'],
      description: 'Run linter and type checker',
      phony: true,
    },
    format: {
      name: 'format',
      deps: [],
      commands: ['black .', 'isort .'],
      description: 'Format source code',
      phony: true,
    },
    run: {
      name: 'run',
      deps: [],
      commands: ['python main.py'],
      description: 'Run the application',
      phony: true,
    },
    clean: {
      name: 'clean',
      deps: [],
      commands: ['find . -type f -name "*.pyc" -delete', 'find . -type d -name "__pycache__" -exec rm -rf {} +', 'rm -rf .pytest_cache dist build *.egg-info'],
      description: 'Remove build artifacts and cache files',
      phony: true,
    },
    build: {
      name: 'build',
      deps: [],
      commands: ['python -m build'],
      description: 'Build distribution packages',
      phony: true,
    },
    publish: {
      name: 'publish',
      deps: ['build'],
      commands: ['twine upload dist/*'],
      description: 'Publish to PyPI',
      phony: true,
    },
  },
  go: {
    build: {
      name: 'build',
      deps: [],
      commands: ['go build -o bin/$(APP_NAME) ./cmd/$(APP_NAME)'],
      description: 'Build the Go binary',
      phony: true,
    },
    run: {
      name: 'run',
      deps: [],
      commands: ['go run ./cmd/$(APP_NAME)'],
      description: 'Run the application',
      phony: true,
    },
    test: {
      name: 'test',
      deps: [],
      commands: ['go test ./... -v -race'],
      description: 'Run all tests with race detection',
      phony: true,
    },
    lint: {
      name: 'lint',
      deps: [],
      commands: ['golangci-lint run'],
      description: 'Run golangci-lint',
      phony: true,
    },
    fmt: {
      name: 'fmt',
      deps: [],
      commands: ['gofmt -s -w .', 'goimports -w .'],
      description: 'Format Go source files',
      phony: true,
    },
    clean: {
      name: 'clean',
      deps: [],
      commands: ['rm -rf bin/'],
      description: 'Remove build output',
      phony: true,
    },
    deps: {
      name: 'deps',
      deps: [],
      commands: ['go mod tidy', 'go mod download'],
      description: 'Download and tidy module dependencies',
      phony: true,
    },
    install: {
      name: 'install',
      deps: ['build'],
      commands: ['go install ./...'],
      description: 'Install binaries to $GOPATH/bin',
      phony: true,
    },
    cover: {
      name: 'cover',
      deps: [],
      commands: ['go test ./... -coverprofile=coverage.out', 'go tool cover -html=coverage.out -o coverage.html'],
      description: 'Generate test coverage report',
      phony: true,
    },
  },
  rust: {
    build: {
      name: 'build',
      deps: [],
      commands: ['cargo build'],
      description: 'Build in debug mode',
      phony: true,
    },
    release: {
      name: 'release',
      deps: [],
      commands: ['cargo build --release'],
      description: 'Build optimized release binary',
      phony: true,
    },
    run: {
      name: 'run',
      deps: [],
      commands: ['cargo run'],
      description: 'Build and run the application',
      phony: true,
    },
    test: {
      name: 'test',
      deps: [],
      commands: ['cargo test'],
      description: 'Run test suite',
      phony: true,
    },
    lint: {
      name: 'lint',
      deps: [],
      commands: ['cargo clippy -- -D warnings'],
      description: 'Run Clippy linter',
      phony: true,
    },
    fmt: {
      name: 'fmt',
      deps: [],
      commands: ['cargo fmt'],
      description: 'Format Rust source files',
      phony: true,
    },
    clean: {
      name: 'clean',
      deps: [],
      commands: ['cargo clean'],
      description: 'Remove Cargo build artifacts',
      phony: true,
    },
    check: {
      name: 'check',
      deps: [],
      commands: ['cargo check'],
      description: 'Check code for errors without building',
      phony: true,
    },
    doc: {
      name: 'doc',
      deps: [],
      commands: ['cargo doc --open'],
      description: 'Build and open documentation',
      phony: true,
    },
    publish: {
      name: 'publish',
      deps: ['test', 'fmt', 'lint'],
      commands: ['cargo publish'],
      description: 'Publish to crates.io',
      phony: true,
    },
  },
  docker: {
    build: {
      name: 'build',
      deps: [],
      commands: ['docker build -t $(IMAGE_NAME):$(TAG) .'],
      description: 'Build Docker image',
      phony: true,
    },
    run: {
      name: 'run',
      deps: [],
      commands: ['docker run -it --rm $(IMAGE_NAME):$(TAG)'],
      description: 'Run container interactively',
      phony: true,
    },
    push: {
      name: 'push',
      deps: ['build'],
      commands: ['docker push $(IMAGE_NAME):$(TAG)'],
      description: 'Push image to registry',
      phony: true,
    },
    up: {
      name: 'up',
      deps: [],
      commands: ['docker compose up -d'],
      description: 'Start services in background',
      phony: true,
    },
    down: {
      name: 'down',
      deps: [],
      commands: ['docker compose down'],
      description: 'Stop and remove containers',
      phony: true,
    },
    logs: {
      name: 'logs',
      deps: [],
      commands: ['docker compose logs -f'],
      description: 'Follow container logs',
      phony: true,
    },
    clean: {
      name: 'clean',
      deps: [],
      commands: ['docker compose down -v --remove-orphans', 'docker image rm -f $(IMAGE_NAME):$(TAG)'],
      description: 'Remove containers, volumes, and image',
      phony: true,
    },
    shell: {
      name: 'shell',
      deps: [],
      commands: ['docker exec -it $(CONTAINER_NAME) /bin/sh'],
      description: 'Open shell in running container',
      phony: true,
    },
    prune: {
      name: 'prune',
      deps: [],
      commands: ['docker system prune -f'],
      description: 'Remove all unused Docker resources',
      phony: true,
    },
  },
  generic: {
    build: {
      name: 'build',
      deps: [],
      commands: ['@echo "Build step not configured"'],
      description: 'Build the project',
      phony: true,
    },
    test: {
      name: 'test',
      deps: [],
      commands: ['@echo "Test step not configured"'],
      description: 'Run tests',
      phony: true,
    },
    lint: {
      name: 'lint',
      deps: [],
      commands: ['@echo "Lint step not configured"'],
      description: 'Run linter',
      phony: true,
    },
    clean: {
      name: 'clean',
      deps: [],
      commands: ['@echo "Clean step not configured"'],
      description: 'Clean build artifacts',
      phony: true,
    },
    install: {
      name: 'install',
      deps: [],
      commands: ['@echo "Install step not configured"'],
      description: 'Install dependencies',
      phony: true,
    },
  },
};

const PROJECT_VARS: Record<ProjectType, Record<string, string>> = {
  node: {},
  python: {},
  go: {
    APP_NAME: 'app',
    VERSION: '0.1.0',
  },
  rust: {},
  docker: {
    IMAGE_NAME: 'myapp',
    TAG: 'latest',
    CONTAINER_NAME: 'myapp',
  },
  generic: {},
};

function parseTargets(description: string): string[] {
  const lower = description.toLowerCase();
  const found: string[] = [];

  const words = lower
    .replace(/[,;]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1);

  for (const word of words) {
    if (!found.includes(word)) found.push(word);
  }

  return found;
}

function resolveTargets(requested: string[], projectType: ProjectType): { resolved: MakeTarget[]; unresolved: string[] } {
  const defs = TARGET_DEFS[projectType];
  const resolved: MakeTarget[] = [];
  const unresolved: string[] = [];

  // Aliases
  const aliases: Record<string, string> = {
    format: 'format',
    fmt: 'fmt',
    dep: 'deps',
    dependencies: 'deps',
    coverage: 'cover',
    doc: 'doc',
    docs: 'doc',
    release: 'release',
    dev: 'dev',
    serve: 'dev',
    start: 'start',
    run: 'run',
    push: 'push',
    publish: 'publish',
    up: 'up',
    down: 'down',
    logs: 'logs',
    shell: 'shell',
    prune: 'prune',
    venv: 'venv',
    ci: 'ci',
    check: 'check',
  };

  for (const req of requested) {
    const normalized = aliases[req] || req;
    if (defs[normalized]) {
      if (!resolved.find(r => r.name === defs[normalized].name)) {
        resolved.push(defs[normalized]);
      }
    } else if (defs[req]) {
      if (!resolved.find(r => r.name === defs[req].name)) {
        resolved.push(defs[req]);
      }
    } else {
      // Try partial match
      const partial = Object.keys(defs).find(k => k.startsWith(req) || req.startsWith(k));
      if (partial && !resolved.find(r => r.name === defs[partial].name)) {
        resolved.push(defs[partial]);
      } else if (!['targets', 'target', 'with', 'for', 'and', 'the', 'a', 'an', 'to', 'is', 'node', 'python', 'go', 'rust', 'docker', 'generic', 'project', 'type'].includes(req)) {
        unresolved.push(req);
      }
    }
  }

  return { resolved, unresolved };
}

function buildHelpTarget(targets: MakeTarget[]): MakeTarget {
  const echoLines = targets
    .filter(t => t.name !== 'help')
    .map(t => `\t@echo "  make %-18s ${t.description}"`.replace('%s', t.name));

  return {
    name: 'help',
    deps: [],
    commands: [
      '@echo "Available targets:"',
      ...targets
        .filter(t => t.name !== 'help')
        .map(t => `@printf "  %-20s %s\\n" "${t.name}" "${t.description}"`),
    ],
    description: 'Show this help message',
    phony: true,
  };
}

function renderTarget(target: MakeTarget): string {
  const lines: string[] = [];
  const depsStr = target.deps.length > 0 ? ' ' + target.deps.join(' ') : '';
  lines.push(`${target.name}:${depsStr}`);
  for (const cmd of target.commands) {
    lines.push(`\t${cmd}`);
  }
  if (target.commands.length === 0) {
    lines.push('\t@echo "No commands configured for this target"');
  }
  return lines.join('\n');
}

function getProjectComment(projectType: ProjectType): string {
  switch (projectType) {
    case 'node': return '# Node.js project Makefile';
    case 'python': return '# Python project Makefile';
    case 'go': return '# Go project Makefile';
    case 'rust': return '# Rust project Makefile';
    case 'docker': return '# Docker project Makefile';
    default: return '# Project Makefile';
  }
}

export function generateMakefile(input: string, projectType: ProjectType): MakefileResult {
  const warnings: string[] = [];
  const requestedWords = parseTargets(input);

  const { resolved, unresolved } = resolveTargets(requestedWords, projectType);

  if (unresolved.length > 0) {
    warnings.push(
      'Unrecognized targets for ' + projectType + ': ' + unresolved.join(', ') +
      '. Supported: ' + Object.keys(TARGET_DEFS[projectType]).join(', ')
    );
  }

  // Always add help target first
  const helpTarget = buildHelpTarget(resolved.length > 0 ? resolved : Object.values(TARGET_DEFS[projectType]));

  const allTargets = [helpTarget, ...resolved];

  // Default targets if none recognized
  if (resolved.length === 0) {
    const defaultKeys = ['build', 'test', 'lint', 'clean'];
    for (const k of defaultKeys) {
      const def = TARGET_DEFS[projectType][k];
      if (def) allTargets.push(def);
    }
    warnings.push('No specific targets recognized. Generated default targets: build, test, lint, clean.');
  }

  const phonyNames = allTargets.filter(t => t.phony).map(t => t.name);

  const vars = PROJECT_VARS[projectType];
  const varLines = Object.entries(vars).map(([k, v]) => `${k} ?= ${v}`);

  const lines: string[] = [
    getProjectComment(projectType),
    '# Generated by DevOven Makefile Generator',
    '',
    '.DEFAULT_GOAL := help',
    '',
  ];

  if (varLines.length > 0) {
    lines.push('# Variables');
    lines.push(...varLines);
    lines.push('');
  }

  lines.push('.PHONY: ' + phonyNames.join(' '));
  lines.push('');

  for (const target of allTargets) {
    if (target.description) {
      lines.push('## ' + target.description);
    }
    lines.push(renderTarget(target));
    lines.push('');
  }

  return {
    content: lines.join('\n').trimEnd() + '\n',
    targets: allTargets.map(t => t.name),
    warnings,
  };
}
