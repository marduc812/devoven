// ─── Tech Stack Detector Logic ────────────────────────────────────────────────

export type FileType = 'package.json' | 'requirements.txt' | 'go.mod' | 'Cargo.toml' | 'unknown';

export type DetectedItem = {
  name: string;
  version?: string;
  category: 'frontend' | 'backend' | 'testing' | 'build' | 'deployment' | 'database' | 'other';
};

export type StackResult = {
  fileType: FileType;
  items: DetectedItem[];
  formatted: string;
};

// ─── Package.json detection ────────────────────────────────────────────────────

type PkgCategory = DetectedItem['category'];

const PKG_RULES: Array<{ pattern: RegExp; category: PkgCategory; name?: string }> = [
  // Frontend frameworks
  { pattern: /^react$/, category: 'frontend', name: 'React' },
  { pattern: /^vue$/, category: 'frontend', name: 'Vue.js' },
  { pattern: /^@angular\/core$/, category: 'frontend', name: 'Angular' },
  { pattern: /^svelte$/, category: 'frontend', name: 'Svelte' },
  { pattern: /^solid-js$/, category: 'frontend', name: 'SolidJS' },
  { pattern: /^preact$/, category: 'frontend', name: 'Preact' },
  { pattern: /^lit$/, category: 'frontend', name: 'Lit' },
  // Meta-frameworks
  { pattern: /^next$/, category: 'frontend', name: 'Next.js' },
  { pattern: /^nuxt$/, category: 'frontend', name: 'Nuxt.js' },
  { pattern: /^@remix-run\/react$/, category: 'frontend', name: 'Remix' },
  { pattern: /^gatsby$/, category: 'frontend', name: 'Gatsby' },
  { pattern: /^astro$/, category: 'frontend', name: 'Astro' },
  { pattern: /^sveltekit$|^@sveltejs\/kit$/, category: 'frontend', name: 'SvelteKit' },
  // Backend frameworks
  { pattern: /^express$/, category: 'backend', name: 'Express.js' },
  { pattern: /^fastify$/, category: 'backend', name: 'Fastify' },
  { pattern: /^koa$/, category: 'backend', name: 'Koa' },
  { pattern: /^hapi$|^@hapi\/hapi$/, category: 'backend', name: 'Hapi.js' },
  { pattern: /^nestjs$|^@nestjs\/core$/, category: 'backend', name: 'NestJS' },
  { pattern: /^hono$/, category: 'backend', name: 'Hono' },
  { pattern: /^elysia$/, category: 'backend', name: 'Elysia' },
  // Databases / ORM
  { pattern: /^mongoose$/, category: 'database', name: 'Mongoose (MongoDB)' },
  { pattern: /^prisma$|^@prisma\/client$/, category: 'database', name: 'Prisma ORM' },
  { pattern: /^drizzle-orm$/, category: 'database', name: 'Drizzle ORM' },
  { pattern: /^sequelize$/, category: 'database', name: 'Sequelize' },
  { pattern: /^typeorm$/, category: 'database', name: 'TypeORM' },
  { pattern: /^pg$/, category: 'database', name: 'PostgreSQL (pg)' },
  { pattern: /^mysql2?$/, category: 'database', name: 'MySQL' },
  { pattern: /^redis$|^ioredis$/, category: 'database', name: 'Redis' },
  { pattern: /^@supabase\/supabase-js$/, category: 'database', name: 'Supabase' },
  // Testing
  { pattern: /^jest$/, category: 'testing', name: 'Jest' },
  { pattern: /^vitest$/, category: 'testing', name: 'Vitest' },
  { pattern: /^mocha$/, category: 'testing', name: 'Mocha' },
  { pattern: /^jasmine$/, category: 'testing', name: 'Jasmine' },
  { pattern: /^@playwright\/test$/, category: 'testing', name: 'Playwright' },
  { pattern: /^cypress$/, category: 'testing', name: 'Cypress' },
  { pattern: /^puppeteer$/, category: 'testing', name: 'Puppeteer' },
  { pattern: /^@testing-library\/react$/, category: 'testing', name: 'React Testing Library' },
  { pattern: /^supertest$/, category: 'testing', name: 'Supertest' },
  // Build tools
  { pattern: /^vite$/, category: 'build', name: 'Vite' },
  { pattern: /^webpack$/, category: 'build', name: 'Webpack' },
  { pattern: /^rollup$/, category: 'build', name: 'Rollup' },
  { pattern: /^esbuild$/, category: 'build', name: 'esbuild' },
  { pattern: /^parcel$/, category: 'build', name: 'Parcel' },
  { pattern: /^turbo$|^turbopack$/, category: 'build', name: 'Turborepo/Turbopack' },
  { pattern: /^typescript$/, category: 'build', name: 'TypeScript' },
  { pattern: /^eslint$/, category: 'build', name: 'ESLint' },
  { pattern: /^prettier$/, category: 'build', name: 'Prettier' },
  { pattern: /^tailwindcss$/, category: 'frontend', name: 'Tailwind CSS' },
  // Deployment
  { pattern: /^@vercel\/node$|^vercel$/, category: 'deployment', name: 'Vercel' },
  { pattern: /^serverless$/, category: 'deployment', name: 'Serverless Framework' },
  { pattern: /^netlify-lambda$/, category: 'deployment', name: 'Netlify' },
];

function detectPackageJson(raw: string): DetectedItem[] {
  let pkg: Record<string, unknown>;
  try {
    pkg = JSON.parse(raw);
  } catch {
    return [];
  }

  const allDeps: Record<string, string> = {
    ...(pkg['dependencies'] as Record<string, string> ?? {}),
    ...(pkg['devDependencies'] as Record<string, string> ?? {}),
    ...(pkg['peerDependencies'] as Record<string, string> ?? {}),
  };

  const items: DetectedItem[] = [];
  const seen = new Set<string>();

  for (const [depName, version] of Object.entries(allDeps)) {
    for (const rule of PKG_RULES) {
      if (rule.pattern.test(depName)) {
        const label = rule.name ?? depName;
        if (!seen.has(label)) {
          seen.add(label);
          items.push({ name: label, version: String(version), category: rule.category });
        }
        break;
      }
    }
  }

  return items;
}

// ─── requirements.txt detection ───────────────────────────────────────────────

const PY_RULES: Array<{ pattern: RegExp; category: PkgCategory; name: string }> = [
  { pattern: /^django/i, category: 'backend', name: 'Django' },
  { pattern: /^flask/i, category: 'backend', name: 'Flask' },
  { pattern: /^fastapi/i, category: 'backend', name: 'FastAPI' },
  { pattern: /^tornado/i, category: 'backend', name: 'Tornado' },
  { pattern: /^starlette/i, category: 'backend', name: 'Starlette' },
  { pattern: /^aiohttp/i, category: 'backend', name: 'aiohttp' },
  { pattern: /^sqlalchemy/i, category: 'database', name: 'SQLAlchemy' },
  { pattern: /^alembic/i, category: 'database', name: 'Alembic' },
  { pattern: /^psycopg2/i, category: 'database', name: 'psycopg2 (PostgreSQL)' },
  { pattern: /^pymongo/i, category: 'database', name: 'PyMongo (MongoDB)' },
  { pattern: /^redis/i, category: 'database', name: 'Redis-py' },
  { pattern: /^celery/i, category: 'backend', name: 'Celery' },
  { pattern: /^pytest/i, category: 'testing', name: 'pytest' },
  { pattern: /^unittest2/i, category: 'testing', name: 'unittest2' },
  { pattern: /^numpy/i, category: 'other', name: 'NumPy' },
  { pattern: /^pandas/i, category: 'other', name: 'Pandas' },
  { pattern: /^scikit.learn/i, category: 'other', name: 'scikit-learn' },
  { pattern: /^tensorflow/i, category: 'other', name: 'TensorFlow' },
  { pattern: /^torch/i, category: 'other', name: 'PyTorch' },
  { pattern: /^requests/i, category: 'backend', name: 'Requests' },
  { pattern: /^httpx/i, category: 'backend', name: 'httpx' },
  { pattern: /^pydantic/i, category: 'backend', name: 'Pydantic' },
  { pattern: /^uvicorn/i, category: 'deployment', name: 'Uvicorn' },
  { pattern: /^gunicorn/i, category: 'deployment', name: 'Gunicorn' },
];

function detectRequirementsTxt(raw: string): DetectedItem[] {
  const items: DetectedItem[] = [];
  const seen = new Set<string>();

  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('-')) continue;

    // Strip version specifiers: requests>=2.0,<3.0  →  requests
    const pkgName = trimmed.split(/[=><!\[;]/)[0].trim();
    const versionMatch = trimmed.match(/[=<>!]+\s*([^\s,;]+)/);
    const version = versionMatch ? versionMatch[1] : undefined;

    for (const rule of PY_RULES) {
      if (rule.pattern.test(pkgName)) {
        if (!seen.has(rule.name)) {
          seen.add(rule.name);
          items.push({ name: rule.name, version, category: rule.category });
        }
        break;
      }
    }
  }

  return items;
}

// ─── go.mod detection ─────────────────────────────────────────────────────────

const GO_RULES: Array<{ pattern: RegExp; category: PkgCategory; name: string }> = [
  { pattern: /gin-gonic\/gin/, category: 'backend', name: 'Gin' },
  { pattern: /labstack\/echo/, category: 'backend', name: 'Echo' },
  { pattern: /gofiber\/fiber/, category: 'backend', name: 'Fiber' },
  { pattern: /gorilla\/mux/, category: 'backend', name: 'Gorilla Mux' },
  { pattern: /go-chi\/chi/, category: 'backend', name: 'Chi' },
  { pattern: /gorm\.io\/gorm/, category: 'database', name: 'GORM' },
  { pattern: /jackc\/pgx/, category: 'database', name: 'pgx (PostgreSQL)' },
  { pattern: /go-redis\/redis/, category: 'database', name: 'go-redis' },
  { pattern: /mongodb\/mongo-go-driver/, category: 'database', name: 'MongoDB Go Driver' },
  { pattern: /stretchr\/testify/, category: 'testing', name: 'Testify' },
  { pattern: /golang\/mock/, category: 'testing', name: 'gomock' },
  { pattern: /urfave\/cli/, category: 'other', name: 'urfave/cli' },
  { pattern: /spf13\/cobra/, category: 'other', name: 'Cobra CLI' },
  { pattern: /spf13\/viper/, category: 'other', name: 'Viper (config)' },
  { pattern: /uber-go\/zap/, category: 'other', name: 'Zap (logging)' },
  { pattern: /sirupsen\/logrus/, category: 'other', name: 'Logrus' },
  { pattern: /grpc/, category: 'backend', name: 'gRPC' },
  { pattern: /protobuf/, category: 'backend', name: 'Protocol Buffers' },
];

function detectGoMod(raw: string): DetectedItem[] {
  const items: DetectedItem[] = [];
  const seen = new Set<string>();

  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('module') || trimmed.startsWith('go ')) continue;

    // Lines like: github.com/gin-gonic/gin v1.7.4
    const versionMatch = trimmed.match(/^(\S+)\s+(v[\d.]+)/);
    const modulePath = versionMatch ? versionMatch[1] : trimmed.split(/\s/)[0];
    const version = versionMatch ? versionMatch[2] : undefined;

    for (const rule of GO_RULES) {
      if (rule.pattern.test(modulePath)) {
        if (!seen.has(rule.name)) {
          seen.add(rule.name);
          items.push({ name: rule.name, version, category: rule.category });
        }
        break;
      }
    }
  }

  return items;
}

// ─── Cargo.toml detection ─────────────────────────────────────────────────────

const RUST_RULES: Array<{ pattern: RegExp; category: PkgCategory; name: string }> = [
  { pattern: /^actix-web$/, category: 'backend', name: 'Actix Web' },
  { pattern: /^axum$/, category: 'backend', name: 'Axum' },
  { pattern: /^rocket$/, category: 'backend', name: 'Rocket' },
  { pattern: /^warp$/, category: 'backend', name: 'Warp' },
  { pattern: /^hyper$/, category: 'backend', name: 'Hyper' },
  { pattern: /^tokio$/, category: 'backend', name: 'Tokio (async runtime)' },
  { pattern: /^async-std$/, category: 'backend', name: 'async-std' },
  { pattern: /^sqlx$/, category: 'database', name: 'SQLx' },
  { pattern: /^diesel$/, category: 'database', name: 'Diesel ORM' },
  { pattern: /^sea-orm$/, category: 'database', name: 'SeaORM' },
  { pattern: /^redis$/, category: 'database', name: 'redis-rs' },
  { pattern: /^mongodb$/, category: 'database', name: 'MongoDB Rust Driver' },
  { pattern: /^serde$|^serde_json$/, category: 'other', name: 'Serde' },
  { pattern: /^clap$/, category: 'other', name: 'Clap (CLI)' },
  { pattern: /^reqwest$/, category: 'backend', name: 'Reqwest (HTTP client)' },
  { pattern: /^tracing$/, category: 'other', name: 'Tracing' },
  { pattern: /^log$|^env_logger$/, category: 'other', name: 'log / env_logger' },
  { pattern: /^tokio-test$|^mockall$|^proptest$/, category: 'testing', name: 'Rust Testing Utils' },
  { pattern: /^tauri$/, category: 'frontend', name: 'Tauri (desktop)' },
  { pattern: /^wasm-bindgen$/, category: 'frontend', name: 'wasm-bindgen (WASM)' },
  { pattern: /^yew$/, category: 'frontend', name: 'Yew (WASM frontend)' },
];

function detectCargoToml(raw: string): DetectedItem[] {
  const items: DetectedItem[] = [];
  const seen = new Set<string>();

  // Simple TOML parsing for [dependencies] sections
  const depRegex = /^([a-zA-Z0-9_-]+)\s*=\s*(?:"([^"]+)"|[{][^}]*version\s*=\s*"([^"]+)"[^}]*[}])/gm;
  let m: RegExpExecArray | null;

  while ((m = depRegex.exec(raw)) !== null) {
    const pkgName = m[1].trim();
    const version = m[2] ?? m[3];

    for (const rule of RUST_RULES) {
      if (rule.pattern.test(pkgName)) {
        if (!seen.has(rule.name)) {
          seen.add(rule.name);
          items.push({ name: rule.name, version, category: rule.category });
        }
        break;
      }
    }
  }

  return items;
}

// ─── Format output ────────────────────────────────────────────────────────────

function detectFileType(input: string): FileType {
  const trimmed = input.trim();
  if (trimmed.startsWith('{')) return 'package.json';
  if (/^module\s+\S+/m.test(trimmed) && /^require\s*\(/m.test(trimmed)) return 'go.mod';
  if (/^\[package\]/m.test(trimmed) && /^\[dependencies\]/m.test(trimmed)) return 'Cargo.toml';
  if (/^[a-zA-Z0-9_-]+(==|>=|<=|~=|!=|>|<|\s*$)/m.test(trimmed)) return 'requirements.txt';
  return 'unknown';
}

function formatResults(items: DetectedItem[], fileType: FileType): string {
  if (items.length === 0) {
    return `No recognized packages detected in ${fileType}.\n\nTip: Make sure to paste the full file content.`;
  }

  const CATS: Array<{ key: DetectedItem['category']; label: string }> = [
    { key: 'frontend', label: 'Frontend' },
    { key: 'backend', label: 'Backend / Runtime' },
    { key: 'database', label: 'Database / ORM' },
    { key: 'testing', label: 'Testing' },
    { key: 'build', label: 'Build Tools' },
    { key: 'deployment', label: 'Deployment' },
    { key: 'other', label: 'Other Libraries' },
  ];

  const lines: string[] = [
    `╔══════════════════════════════════════════════════╗`,
    `║  Tech Stack Detected (${fileType})`,
    `╚══════════════════════════════════════════════════╝`,
    ``,
  ];

  for (const { key, label } of CATS) {
    const group = items.filter(i => i.category === key);
    if (group.length === 0) continue;
    lines.push(`─── ${label} ${'─'.repeat(Math.max(0, 44 - label.length))}`);
    for (const item of group) {
      const ver = item.version ? `  (${item.version})` : '';
      lines.push(`  • ${item.name}${ver}`);
    }
    lines.push('');
  }

  lines.push(`─── Summary ─────────────────────────────────────`);
  lines.push(`  Total detected: ${items.length} packages/frameworks`);

  return lines.join('\n');
}

export function detectStack(input: string): StackResult {
  const fileType = detectFileType(input);
  let items: DetectedItem[] = [];

  switch (fileType) {
    case 'package.json':
      items = detectPackageJson(input);
      break;
    case 'requirements.txt':
      items = detectRequirementsTxt(input);
      break;
    case 'go.mod':
      items = detectGoMod(input);
      break;
    case 'Cargo.toml':
      items = detectCargoToml(input);
      break;
    default:
      // Try all
      items = [
        ...detectPackageJson(input),
        ...detectRequirementsTxt(input),
        ...detectGoMod(input),
        ...detectCargoToml(input),
      ];
  }

  return {
    fileType,
    items,
    formatted: formatResults(items, fileType),
  };
}
