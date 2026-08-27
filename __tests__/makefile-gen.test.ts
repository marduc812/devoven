import { generateMakefile, ProjectType } from '@/Components/Functions/MakefileGenTools/logic';

describe('generateMakefile - node', () => {
  it('generates build target for node', () => {
    const result = generateMakefile('build', 'node');
    expect(result.content).toContain('build:');
    expect(result.content).toContain('npm run build');
  });

  it('generates install target', () => {
    const result = generateMakefile('install', 'node');
    expect(result.content).toContain('npm install');
  });

  it('generates test target', () => {
    const result = generateMakefile('test', 'node');
    expect(result.content).toContain('npm test');
  });

  it('generates clean target', () => {
    const result = generateMakefile('clean', 'node');
    expect(result.content).toContain('clean:');
  });

  it('always includes help target', () => {
    const result = generateMakefile('build, test', 'node');
    expect(result.content).toContain('help:');
    expect(result.targets).toContain('help');
  });

  it('includes .PHONY declaration', () => {
    const result = generateMakefile('build', 'node');
    expect(result.content).toContain('.PHONY:');
  });

  it('sets DEFAULT_GOAL to help', () => {
    const result = generateMakefile('build', 'node');
    expect(result.content).toContain('.DEFAULT_GOAL := help');
  });
});

describe('generateMakefile - python', () => {
  it('uses pip install for install', () => {
    const result = generateMakefile('install', 'python');
    expect(result.content).toContain('pip install');
  });

  it('uses pytest for test', () => {
    const result = generateMakefile('test', 'python');
    expect(result.content).toContain('pytest');
  });

  it('generates venv target', () => {
    const result = generateMakefile('venv', 'python');
    expect(result.content).toContain('.venv');
  });
});

describe('generateMakefile - go', () => {
  it('uses go build', () => {
    const result = generateMakefile('build', 'go');
    expect(result.content).toContain('go build');
  });

  it('includes APP_NAME variable', () => {
    const result = generateMakefile('build', 'go');
    expect(result.content).toContain('APP_NAME');
  });

  it('uses go test for test', () => {
    const result = generateMakefile('test', 'go');
    expect(result.content).toContain('go test');
  });
});

describe('generateMakefile - rust', () => {
  it('uses cargo build', () => {
    const result = generateMakefile('build', 'rust');
    expect(result.content).toContain('cargo build');
  });

  it('uses cargo test', () => {
    const result = generateMakefile('test', 'rust');
    expect(result.content).toContain('cargo test');
  });

  it('generates release target', () => {
    const result = generateMakefile('release', 'rust');
    expect(result.content).toContain('--release');
  });
});

describe('generateMakefile - docker', () => {
  it('uses docker build', () => {
    const result = generateMakefile('build', 'docker');
    expect(result.content).toContain('docker build');
  });

  it('uses docker compose up for up', () => {
    const result = generateMakefile('up', 'docker');
    expect(result.content).toContain('docker compose up');
  });

  it('includes IMAGE_NAME variable', () => {
    const result = generateMakefile('build', 'docker');
    expect(result.content).toContain('IMAGE_NAME');
  });
});

describe('generateMakefile - multiple targets', () => {
  it('generates multiple targets from comma-separated input', () => {
    const result = generateMakefile('install, build, test, lint, clean', 'node');
    expect(result.targets).toContain('install');
    expect(result.targets).toContain('build');
    expect(result.targets).toContain('test');
    expect(result.targets).toContain('lint');
    expect(result.targets).toContain('clean');
  });

  it('warns about unrecognized targets', () => {
    const result = generateMakefile('unknowntarget123', 'node');
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});

describe('generateMakefile - output format', () => {
  it('uses tab indentation for commands', () => {
    const result = generateMakefile('build', 'node');
    const lines = result.content.split('\n');
    const cmdLine = lines.find(l => l.includes('npm run build'));
    expect(cmdLine).toBeDefined();
    expect(cmdLine!.startsWith('\t')).toBe(true);
  });

  it('includes comment header', () => {
    const result = generateMakefile('build', 'node');
    expect(result.content).toContain('# Node.js project Makefile');
  });
});
