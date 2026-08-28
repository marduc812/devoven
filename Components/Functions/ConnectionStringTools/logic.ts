// Connection String Builder — pure TypeScript, no browser APIs

export type DbType = 'postgresql' | 'mysql' | 'mongodb' | 'redis';

export interface ConnectionParams {
  dbType: DbType;
  host: string;
  port: string;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
}

export interface ConnectionFormat {
  label: string;
  format: string;
  value: string;
}

function encodePassword(pw: string): string {
  // percent-encode special chars in passwords for URLs
  return pw
    .replace(/%/g, '%25')
    .replace(/@/g, '%40')
    .replace(/:/g, '%3A')
    .replace(/\//g, '%2F')
    .replace(/\?/g, '%3F')
    .replace(/#/g, '%23')
    .replace(/\[/g, '%5B')
    .replace(/\]/g, '%5D');
}

function defaultPort(dbType: DbType): string {
  switch (dbType) {
    case 'postgresql': return '5432';
    case 'mysql': return '3306';
    case 'mongodb': return '27017';
    case 'redis': return '6379';
  }
}

export function buildConnectionStrings(params: ConnectionParams): ConnectionFormat[] {
  const {
    dbType,
    host,
    port,
    database,
    username,
    password,
    ssl,
  } = params;

  const h = host || 'localhost';
  const p = port || defaultPort(dbType);
  const db = database || 'mydb';
  const user = username || 'root';
  const pw = encodePassword(password);
  const rawPw = password;
  const sslSuffix = ssl ? '?sslmode=require' : '';

  if (dbType === 'postgresql') {
    return [
      {
        label: 'URI (libpq)',
        format: 'postgresql://user:password@host:port/database',
        value: `postgresql://${user}:${pw}@${h}:${p}/${db}${sslSuffix}`,
      },
      {
        label: 'psycopg2 (Python)',
        format: 'psycopg2.connect(host=..., dbname=..., user=..., password=..., port=...)',
        value: `host=${h} port=${p} dbname=${db} user=${user} password=${rawPw || "''"} ${ssl ? 'sslmode=require' : ''}`.trim(),
      },
      {
        label: 'SQLAlchemy (Python)',
        format: 'postgresql+psycopg2://user:password@host:port/database',
        value: `postgresql+psycopg2://${user}:${pw}@${h}:${p}/${db}${sslSuffix}`,
      },
      {
        label: 'JDBC (Java)',
        format: 'jdbc:postgresql://host:port/database?user=...&password=...',
        value: `jdbc:postgresql://${h}:${p}/${db}?user=${user}&password=${rawPw}${ssl ? '&sslmode=require' : ''}`,
      },
      {
        label: 'Go (pgx / lib/pq)',
        format: 'postgres://user:password@host:port/database?sslmode=...',
        value: `postgres://${user}:${pw}@${h}:${p}/${db}?sslmode=${ssl ? 'require' : 'disable'}`,
      },
      {
        label: 'Node.js (pg)',
        format: '{ host, port, database, user, password, ssl }',
        value: `{\n  host: "${h}",\n  port: ${p},\n  database: "${db}",\n  user: "${user}",\n  password: "${rawPw}",\n  ssl: ${ssl}\n}`,
      },
      {
        label: 'Prisma (schema.prisma)',
        format: 'DATABASE_URL=postgresql://...',
        value: `DATABASE_URL="postgresql://${user}:${pw}@${h}:${p}/${db}${sslSuffix}"`,
      },
    ];
  }

  if (dbType === 'mysql') {
    return [
      {
        label: 'URI',
        format: 'mysql://user:password@host:port/database',
        value: `mysql://${user}:${pw}@${h}:${p}/${db}${ssl ? '?ssl=true' : ''}`,
      },
      {
        label: 'MySQL2 / Node.js',
        format: '{ host, user, password, database, port }',
        value: `{\n  host: "${h}",\n  port: ${p},\n  user: "${user}",\n  password: "${rawPw}",\n  database: "${db}",\n  ssl: ${ssl}\n}`,
      },
      {
        label: 'JDBC (Java)',
        format: 'jdbc:mysql://host:port/database?user=...&password=...',
        value: `jdbc:mysql://${h}:${p}/${db}?user=${user}&password=${rawPw}${ssl ? '&useSSL=true' : '&useSSL=false'}`,
      },
      {
        label: 'SQLAlchemy (Python)',
        format: 'mysql+pymysql://user:password@host:port/database',
        value: `mysql+pymysql://${user}:${pw}@${h}:${p}/${db}`,
      },
      {
        label: 'Prisma (schema.prisma)',
        format: 'DATABASE_URL=mysql://...',
        value: `DATABASE_URL="mysql://${user}:${pw}@${h}:${p}/${db}"`,
      },
    ];
  }

  if (dbType === 'mongodb') {
    const dbPart = db !== 'mydb' || database ? `/${db}` : '';
    return [
      {
        label: 'Standard URI',
        format: 'mongodb://user:password@host:port/database',
        value: username
          ? `mongodb://${user}:${pw}@${h}:${p}${dbPart}${ssl ? '?tls=true' : ''}`
          : `mongodb://${h}:${p}${dbPart}${ssl ? '?tls=true' : ''}`,
      },
      {
        label: 'SRV (Atlas / replica set)',
        format: 'mongodb+srv://user:password@host/database',
        value: username
          ? `mongodb+srv://${user}:${pw}@${h}${dbPart}?retryWrites=true&w=majority`
          : `mongodb+srv://${h}${dbPart}?retryWrites=true&w=majority`,
      },
      {
        label: 'pymongo (Python)',
        format: 'MongoClient("mongodb://...")',
        value: `MongoClient("mongodb://${user ? user + ':' + pw + '@' : ''}${h}:${p}${dbPart}")`,
      },
      {
        label: 'mongoose (Node.js)',
        format: 'mongoose.connect("mongodb://...")',
        value: `mongoose.connect("mongodb://${user ? user + ':' + pw + '@' : ''}${h}:${p}${dbPart}")`,
      },
      {
        label: 'Prisma (schema.prisma)',
        format: 'DATABASE_URL=mongodb://...',
        value: `DATABASE_URL="mongodb://${user ? user + ':' + pw + '@' : ''}${h}:${p}${dbPart}"`,
      },
    ];
  }

  // Redis
  return [
    {
      label: 'URI',
      format: 'redis://user:password@host:port/db',
      value: password
        ? `redis://${username ? user + ':' : ''}${pw}@${h}:${p}/${db === 'mydb' ? '0' : db}`
        : `redis://${h}:${p}/${db === 'mydb' ? '0' : db}`,
    },
    {
      label: 'ioredis (Node.js)',
      format: '{ host, port, password, db }',
      value: `{\n  host: "${h}",\n  port: ${p},${password ? '\n  password: "' + rawPw + '",' : ''}\n  db: ${db === 'mydb' ? '0' : db},\n  tls: ${ssl}\n}`,
    },
    {
      label: 'redis-py (Python)',
      format: 'Redis(host=..., port=..., password=..., db=...)',
      value: `Redis(host="${h}", port=${p}, ${password ? 'password="' + rawPw + '", ' : ''}db=${db === 'mydb' ? '0' : db}, ssl=${ssl ? 'True' : 'False'})`,
    },
    {
      label: 'Upstash / REST URL',
      format: 'REDIS_URL=rediss://...',
      value: `REDIS_URL="${ssl ? 'rediss' : 'redis'}://${password ? ':' + pw + '@' : ''}${h}:${p}"`,
    },
  ];
}
