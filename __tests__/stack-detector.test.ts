import { detectStack } from '@/Components/Functions/StackDetectorTools/logic';

const PACKAGE_JSON = JSON.stringify({
  dependencies: {
    react: '^18.0.0',
    next: '^14.0.0',
    express: '^4.18.0',
    '@prisma/client': '^5.0.0',
  },
  devDependencies: {
    jest: '^29.0.0',
    typescript: '^5.0.0',
    tailwindcss: '^3.0.0',
  },
});

const REQUIREMENTS_TXT = `
django==4.2.0
djangorestframework>=3.14
pytest==7.4.0
sqlalchemy==2.0.0
uvicorn==0.23.0
`;

const GO_MOD = `
module github.com/example/myapp

go 1.21

require (
\tgithub.com/gin-gonic/gin v1.9.1
\tgorm.io/gorm v1.25.0
\tgithub.com/stretchr/testify v1.8.4
)
`;

const CARGO_TOML = `
[package]
name = "my-app"
version = "0.1.0"

[dependencies]
axum = "0.7.0"
tokio = { version = "1.0", features = ["full"] }
serde = "1.0"
sqlx = "0.7.0"
`;

describe('detectStack - package.json', () => {
  it('detects React', () => {
    const result = detectStack(PACKAGE_JSON);
    const names = result.items.map(i => i.name);
    expect(names).toContain('React');
  });

  it('detects Next.js', () => {
    const result = detectStack(PACKAGE_JSON);
    const names = result.items.map(i => i.name);
    expect(names).toContain('Next.js');
  });

  it('detects Express.js as backend', () => {
    const result = detectStack(PACKAGE_JSON);
    const express = result.items.find(i => i.name === 'Express.js');
    expect(express).toBeDefined();
    expect(express!.category).toBe('backend');
  });

  it('detects Prisma as database', () => {
    const result = detectStack(PACKAGE_JSON);
    const prisma = result.items.find(i => i.name === 'Prisma ORM');
    expect(prisma).toBeDefined();
    expect(prisma!.category).toBe('database');
  });

  it('detects Jest as testing', () => {
    const result = detectStack(PACKAGE_JSON);
    const jest = result.items.find(i => i.name === 'Jest');
    expect(jest).toBeDefined();
    expect(jest!.category).toBe('testing');
  });

  it('identifies file type as package.json', () => {
    const result = detectStack(PACKAGE_JSON);
    expect(result.fileType).toBe('package.json');
  });
});

describe('detectStack - requirements.txt', () => {
  it('detects Django as backend', () => {
    const result = detectStack(REQUIREMENTS_TXT.trim());
    const django = result.items.find(i => i.name === 'Django');
    expect(django).toBeDefined();
    expect(django!.category).toBe('backend');
  });

  it('detects pytest as testing', () => {
    const result = detectStack(REQUIREMENTS_TXT.trim());
    const pytest = result.items.find(i => i.name === 'pytest');
    expect(pytest).toBeDefined();
  });

  it('detects SQLAlchemy', () => {
    const result = detectStack(REQUIREMENTS_TXT.trim());
    const names = result.items.map(i => i.name);
    expect(names).toContain('SQLAlchemy');
  });
});

describe('detectStack - go.mod', () => {
  it('detects Gin as backend', () => {
    const result = detectStack(GO_MOD.trim());
    const gin = result.items.find(i => i.name === 'Gin');
    expect(gin).toBeDefined();
    expect(gin!.category).toBe('backend');
  });

  it('detects GORM as database', () => {
    const result = detectStack(GO_MOD.trim());
    const gorm = result.items.find(i => i.name === 'GORM');
    expect(gorm).toBeDefined();
  });
});

describe('detectStack - Cargo.toml', () => {
  it('detects Axum as backend', () => {
    const result = detectStack(CARGO_TOML.trim());
    const axum = result.items.find(i => i.name === 'Axum');
    expect(axum).toBeDefined();
    expect(axum!.category).toBe('backend');
  });

  it('detects Tokio', () => {
    const result = detectStack(CARGO_TOML.trim());
    const names = result.items.map(i => i.name);
    expect(names).toContain('Tokio (async runtime)');
  });
});

describe('detectStack - formatted output', () => {
  it('formats output with sections', () => {
    const result = detectStack(PACKAGE_JSON);
    expect(result.formatted).toContain('Tech Stack Detected');
    expect(result.formatted).toContain('Frontend');
  });

  it('handles empty/unknown input', () => {
    const result = detectStack('random text here');
    expect(result.formatted).toContain('No recognized packages detected');
  });
});
