import { buildConnectionStrings, ConnectionParams } from '../Components/Functions/ConnectionStringTools/logic';

const pgParams: ConnectionParams = {
  dbType: 'postgresql',
  host: 'db.example.com',
  port: '5432',
  database: 'myapp',
  username: 'admin',
  password: 'secret',
  ssl: false,
};

describe('buildConnectionStrings - PostgreSQL', () => {
  it('returns multiple formats', () => {
    const formats = buildConnectionStrings(pgParams);
    expect(formats.length).toBeGreaterThan(3);
  });

  it('includes URI format', () => {
    const formats = buildConnectionStrings(pgParams);
    const uri = formats.find(f => f.label.includes('URI'));
    expect(uri).toBeDefined();
    expect(uri!.value).toContain('postgresql://');
    expect(uri!.value).toContain('db.example.com');
    expect(uri!.value).toContain('myapp');
  });

  it('includes JDBC format', () => {
    const formats = buildConnectionStrings(pgParams);
    const jdbc = formats.find(f => f.label.includes('JDBC'));
    expect(jdbc?.value).toContain('jdbc:postgresql://');
  });

  it('includes SQLAlchemy format', () => {
    const formats = buildConnectionStrings(pgParams);
    const sa = formats.find(f => f.label.includes('SQLAlchemy'));
    expect(sa?.value).toContain('postgresql+psycopg2://');
  });

  it('adds sslmode when ssl is true', () => {
    const formats = buildConnectionStrings({ ...pgParams, ssl: true });
    const uri = formats.find(f => f.label.includes('URI'));
    expect(uri?.value).toContain('sslmode=require');
  });

  it('encodes @ in password', () => {
    const formats = buildConnectionStrings({ ...pgParams, password: 'p@ss' });
    const uri = formats.find(f => f.label.includes('URI'));
    expect(uri?.value).toContain('%40');
    expect(uri?.value).not.toContain(':p@');
  });
});

describe('buildConnectionStrings - MySQL', () => {
  const mysqlParams: ConnectionParams = { ...pgParams, dbType: 'mysql', port: '3306' };

  it('returns MySQL-specific formats', () => {
    const formats = buildConnectionStrings(mysqlParams);
    const uri = formats.find(f => f.label.includes('URI'));
    expect(uri?.value).toContain('mysql://');
  });

  it('includes JDBC MySQL format', () => {
    const formats = buildConnectionStrings(mysqlParams);
    const jdbc = formats.find(f => f.label.includes('JDBC'));
    expect(jdbc?.value).toContain('jdbc:mysql://');
  });
});

describe('buildConnectionStrings - MongoDB', () => {
  const mongoParams: ConnectionParams = { ...pgParams, dbType: 'mongodb', port: '27017' };

  it('includes standard URI', () => {
    const formats = buildConnectionStrings(mongoParams);
    const uri = formats.find(f => f.label.includes('Standard URI'));
    expect(uri?.value).toContain('mongodb://');
  });

  it('includes SRV format', () => {
    const formats = buildConnectionStrings(mongoParams);
    const srv = formats.find(f => f.label.includes('SRV'));
    expect(srv?.value).toContain('mongodb+srv://');
  });

  it('includes mongoose format', () => {
    const formats = buildConnectionStrings(mongoParams);
    const mg = formats.find(f => f.label.toLowerCase().includes('mongoose'));
    expect(mg?.value).toContain('mongoose.connect');
  });
});

describe('buildConnectionStrings - Redis', () => {
  const redisParams: ConnectionParams = {
    dbType: 'redis',
    host: 'cache.example.com',
    port: '6379',
    database: '0',
    username: '',
    password: 'redispass',
    ssl: false,
  };

  it('includes redis URI', () => {
    const formats = buildConnectionStrings(redisParams);
    const uri = formats.find(f => f.label.includes('URI'));
    expect(uri?.value).toContain('redis://');
  });

  it('uses rediss:// when ssl is true', () => {
    const formats = buildConnectionStrings({ ...redisParams, ssl: true });
    const upstash = formats.find(f => f.label.includes('Upstash'));
    expect(upstash?.value).toContain('rediss://');
  });

  it('includes redis-py format', () => {
    const formats = buildConnectionStrings(redisParams);
    const py = formats.find(f => f.label.includes('redis-py'));
    expect(py?.value).toContain('Redis(');
  });
});
