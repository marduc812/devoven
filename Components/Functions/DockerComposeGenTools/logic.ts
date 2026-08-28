// Docker Compose Generator — pure TypeScript, no browser APIs
// Generates docker-compose.yml snippets from natural language descriptions

export interface ServiceConfig {
  name: string;
  image: string;
  ports: string[];
  environment: Record<string, string>;
  volumes: string[];
  restart: string;
  networks: string[];
  dependsOn: string[];
  healthcheck?: string;
  extraOptions: Record<string, string>;
}

export interface ComposeResult {
  yaml: string;
  services: string[];
  warnings: string[];
}

// Known service templates
const SERVICE_TEMPLATES: Record<string, Partial<ServiceConfig>> = {
  postgres: {
    image: 'postgres:15',
    ports: ['5432:5432'],
    environment: {
      POSTGRES_USER: 'admin',
      POSTGRES_PASSWORD: 'secret',
      POSTGRES_DB: 'mydb',
    },
    volumes: ['postgres_data:/var/lib/postgresql/data'],
    restart: 'unless-stopped',
  },
  postgresql: {
    image: 'postgres:15',
    ports: ['5432:5432'],
    environment: {
      POSTGRES_USER: 'admin',
      POSTGRES_PASSWORD: 'secret',
      POSTGRES_DB: 'mydb',
    },
    volumes: ['postgres_data:/var/lib/postgresql/data'],
    restart: 'unless-stopped',
  },
  pg: {
    image: 'postgres:15',
    ports: ['5432:5432'],
    environment: {
      POSTGRES_USER: 'admin',
      POSTGRES_PASSWORD: 'secret',
      POSTGRES_DB: 'mydb',
    },
    volumes: ['postgres_data:/var/lib/postgresql/data'],
    restart: 'unless-stopped',
  },
  mysql: {
    image: 'mysql:8',
    ports: ['3306:3306'],
    environment: {
      MYSQL_ROOT_PASSWORD: 'rootsecret',
      MYSQL_DATABASE: 'mydb',
      MYSQL_USER: 'admin',
      MYSQL_PASSWORD: 'secret',
    },
    volumes: ['mysql_data:/var/lib/mysql'],
    restart: 'unless-stopped',
  },
  mariadb: {
    image: 'mariadb:11',
    ports: ['3306:3306'],
    environment: {
      MARIADB_ROOT_PASSWORD: 'rootsecret',
      MARIADB_DATABASE: 'mydb',
      MARIADB_USER: 'admin',
      MARIADB_PASSWORD: 'secret',
    },
    volumes: ['mariadb_data:/var/lib/mysql'],
    restart: 'unless-stopped',
  },
  redis: {
    image: 'redis:7-alpine',
    ports: ['6379:6379'],
    environment: {},
    volumes: ['redis_data:/data'],
    restart: 'unless-stopped',
  },
  nginx: {
    image: 'nginx:alpine',
    ports: ['80:80', '443:443'],
    environment: {},
    volumes: ['./nginx.conf:/etc/nginx/nginx.conf:ro', './html:/usr/share/nginx/html:ro'],
    restart: 'unless-stopped',
  },
  mongodb: {
    image: 'mongo:7',
    ports: ['27017:27017'],
    environment: {
      MONGO_INITDB_ROOT_USERNAME: 'admin',
      MONGO_INITDB_ROOT_PASSWORD: 'secret',
    },
    volumes: ['mongodb_data:/data/db'],
    restart: 'unless-stopped',
  },
  mongo: {
    image: 'mongo:7',
    ports: ['27017:27017'],
    environment: {
      MONGO_INITDB_ROOT_USERNAME: 'admin',
      MONGO_INITDB_ROOT_PASSWORD: 'secret',
    },
    volumes: ['mongodb_data:/data/db'],
    restart: 'unless-stopped',
  },
  rabbitmq: {
    image: 'rabbitmq:3-management',
    ports: ['5672:5672', '15672:15672'],
    environment: {
      RABBITMQ_DEFAULT_USER: 'admin',
      RABBITMQ_DEFAULT_PASS: 'secret',
    },
    volumes: ['rabbitmq_data:/var/lib/rabbitmq'],
    restart: 'unless-stopped',
  },
  elasticsearch: {
    image: 'elasticsearch:8.12.0',
    ports: ['9200:9200', '9300:9300'],
    environment: {
      'discovery.type': 'single-node',
      'xpack.security.enabled': 'false',
      ES_JAVA_OPTS: '-Xms512m -Xmx512m',
    },
    volumes: ['elasticsearch_data:/usr/share/elasticsearch/data'],
    restart: 'unless-stopped',
  },
  elastic: {
    image: 'elasticsearch:8.12.0',
    ports: ['9200:9200'],
    environment: {
      'discovery.type': 'single-node',
      'xpack.security.enabled': 'false',
    },
    volumes: ['elasticsearch_data:/usr/share/elasticsearch/data'],
    restart: 'unless-stopped',
  },
  memcached: {
    image: 'memcached:1-alpine',
    ports: ['11211:11211'],
    environment: {},
    volumes: [],
    restart: 'unless-stopped',
  },
  kafka: {
    image: 'confluentinc/cp-kafka:7.6.0',
    ports: ['9092:9092'],
    environment: {
      KAFKA_BROKER_ID: '1',
      KAFKA_ZOOKEEPER_CONNECT: 'zookeeper:2181',
      KAFKA_ADVERTISED_LISTENERS: 'PLAINTEXT://localhost:9092',
    },
    volumes: ['kafka_data:/var/lib/kafka/data'],
    restart: 'unless-stopped',
    dependsOn: ['zookeeper'],
  },
  zookeeper: {
    image: 'confluentinc/cp-zookeeper:7.6.0',
    ports: ['2181:2181'],
    environment: {
      ZOOKEEPER_CLIENT_PORT: '2181',
      ZOOKEEPER_TICK_TIME: '2000',
    },
    volumes: ['zookeeper_data:/var/lib/zookeeper/data'],
    restart: 'unless-stopped',
  },
};

function parseVersion(desc: string, serviceName: string): string | null {
  // Look for version number: "postgres 15", "postgres:15", "postgres version 15"
  const versionRe = new RegExp(serviceName + '\\s*(?:version\\s*)?(?::)?\\s*(\\d+(?:\\.\\d+)*)', 'i');
  const m = desc.match(versionRe);
  if (m) return m[1];

  // Generic "version X" near service
  const genericRe = /version\s+(\d+(?:\.\d+)*)/i;
  const gm = desc.match(genericRe);
  if (gm) return gm[1];

  return null;
}

function parsePort(desc: string): string | null {
  const portRe = /port\s+(\d{2,5})(?:\s*:\s*(\d{2,5}))?/i;
  const m = desc.match(portRe);
  if (m) {
    return m[2] ? `${m[1]}:${m[2]}` : `${m[1]}:${m[1]}`;
  }
  return null;
}

function parsePassword(desc: string): string | null {
  const re = /(?:password|pass|passwd)\s+(\S+)/i;
  const m = desc.match(re);
  return m ? m[1] : null;
}

function parseSingleService(desc: string): ServiceConfig | null {
  const lower = desc.toLowerCase().trim();

  let matchedKey: string | null = null;
  for (const key of Object.keys(SERVICE_TEMPLATES)) {
    if (lower.includes(key)) {
      matchedKey = key;
      break;
    }
  }

  if (!matchedKey) return null;

  const template = SERVICE_TEMPLATES[matchedKey];
  const config: ServiceConfig = {
    name: matchedKey === 'pg' ? 'postgres' : matchedKey === 'elastic' ? 'elasticsearch' : matchedKey,
    image: template.image || matchedKey + ':latest',
    ports: [...(template.ports || [])],
    environment: { ...(template.environment || {}) },
    volumes: [...(template.volumes || [])],
    restart: template.restart || 'unless-stopped',
    networks: [],
    dependsOn: [...(template.dependsOn || [])],
    extraOptions: {},
  };

  // Parse version override
  const ver = parseVersion(desc, matchedKey);
  if (ver) {
    const baseImage = config.image.split(':')[0];
    // Append -alpine if original has it
    const suffix = template.image && template.image.includes('-alpine') ? '-alpine' : '';
    config.image = baseImage + ':' + ver + suffix;
  }

  // Parse custom port
  const port = parsePort(desc);
  if (port && config.ports.length > 0) {
    // Override the first port mapping's host port
    const [, containerPort] = config.ports[0].split(':');
    const hostPort = port.split(':')[0];
    config.ports[0] = hostPort + ':' + containerPort;
  }

  // Parse password
  const pw = parsePassword(desc);
  if (pw) {
    for (const key of Object.keys(config.environment)) {
      if (/password|pass/i.test(key)) {
        config.environment[key] = pw;
      }
    }
  }

  // Volume override: remove volume if "no volume" or "without volume" mentioned
  if (/no\s+volume|without\s+volume/i.test(desc)) {
    config.volumes = [];
  }

  // Network
  if (/network\s+(\w+)/i.test(desc)) {
    const nm = desc.match(/network\s+(\w+)/i);
    if (nm) config.networks.push(nm[1]);
  }

  return config;
}

function indentLines(text: string, spaces: number): string {
  const pad = ' '.repeat(spaces);
  return text.split('\n').map(l => pad + l).join('\n');
}

function serviceToYaml(config: ServiceConfig): string {
  const lines: string[] = [];
  lines.push('  ' + config.name + ':');
  lines.push('    image: ' + config.image);
  lines.push('    restart: ' + config.restart);

  if (config.ports.length > 0) {
    lines.push('    ports:');
    config.ports.forEach(p => lines.push('      - "' + p + '"'));
  }

  if (Object.keys(config.environment).length > 0) {
    lines.push('    environment:');
    Object.entries(config.environment).forEach(([k, v]) => {
      lines.push('      ' + k + ': ' + v);
    });
  }

  if (config.volumes.length > 0) {
    lines.push('    volumes:');
    config.volumes.forEach(v => lines.push('      - ' + v));
  }

  if (config.dependsOn.length > 0) {
    lines.push('    depends_on:');
    config.dependsOn.forEach(d => lines.push('      - ' + d));
  }

  if (config.networks.length > 0) {
    lines.push('    networks:');
    config.networks.forEach(n => lines.push('      - ' + n));
  }

  return lines.join('\n');
}

function collectNamedVolumes(configs: ServiceConfig[]): string[] {
  const volumes: string[] = [];
  for (const cfg of configs) {
    for (const v of cfg.volumes) {
      // Named volumes are "name:/path" — skip "./path" and "/abs/path"
      if (!v.startsWith('.') && !v.startsWith('/') && v.includes(':')) {
        const name = v.split(':')[0];
        if (!volumes.includes(name)) volumes.push(name);
      }
    }
  }
  return volumes;
}

function collectNetworks(configs: ServiceConfig[]): string[] {
  const networks: string[] = [];
  for (const cfg of configs) {
    for (const n of cfg.networks) {
      if (!networks.includes(n)) networks.push(n);
    }
  }
  return networks;
}

export function generateCompose(input: string): ComposeResult {
  const warnings: string[] = [];

  if (!input.trim()) {
    return {
      yaml: '',
      services: [],
      warnings: ['Input is empty. Describe a service, e.g. "postgres 15 with persistent volume, port 5432".'],
    };
  }

  // Split by comma or "and" to get multiple services
  const parts = input.split(/,\s*|\s+and\s+/i).filter(p => p.trim().length > 0);

  const configs: ServiceConfig[] = [];
  const unrecognized: string[] = [];

  for (const part of parts) {
    const cfg = parseSingleService(part);
    if (cfg) {
      // Avoid duplicates
      if (!configs.find(c => c.name === cfg.name)) {
        configs.push(cfg);
      }
    } else {
      unrecognized.push(part.trim());
    }
  }

  if (configs.length === 0) {
    return {
      yaml: '',
      services: [],
      warnings: [
        'No recognized services found. Supported: postgres, mysql, mariadb, redis, nginx, mongodb, rabbitmq, elasticsearch, memcached, kafka, zookeeper.',
        'Input was: ' + input,
      ],
    };
  }

  if (unrecognized.length > 0) {
    warnings.push('Unrecognized services skipped: ' + unrecognized.join(', '));
  }

  const namedVolumes = collectNamedVolumes(configs);
  const networks = collectNetworks(configs);

  const yamlLines: string[] = [];
  yamlLines.push('version: "3.9"');
  yamlLines.push('');
  yamlLines.push('services:');
  configs.forEach((cfg, i) => {
    if (i > 0) yamlLines.push('');
    yamlLines.push(serviceToYaml(cfg));
  });

  if (namedVolumes.length > 0) {
    yamlLines.push('');
    yamlLines.push('volumes:');
    namedVolumes.forEach(v => yamlLines.push('  ' + v + ':'));
  }

  if (networks.length > 0) {
    yamlLines.push('');
    yamlLines.push('networks:');
    networks.forEach(n => yamlLines.push('  ' + n + ':'));
  }

  return {
    yaml: yamlLines.join('\n'),
    services: configs.map(c => c.name),
    warnings,
  };
}
