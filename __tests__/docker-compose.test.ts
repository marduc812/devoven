import { parseDockerCompose, serviceToDockerRun, processDockerCompose } from '@/Components/Functions/DockerComposeTools/logic';

const simpleCompose = `
services:
  web:
    image: nginx:latest
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./html:/usr/share/nginx/html
    restart: always
    container_name: my-nginx
`;

const multiCompose = `
services:
  db:
    image: postgres:15
    environment:
      - POSTGRES_USER=admin
      - POSTGRES_PASSWORD=secret
    ports:
      - "5432:5432"
  app:
    image: myapp:latest
    environment:
      APP_ENV: production
      DEBUG: "false"
    ports:
      - "3000:3000"
    depends_on:
      - db
`;

describe('parseDockerCompose', () => {
  it('parses a single service', () => {
    const svcs = parseDockerCompose(simpleCompose);
    expect(svcs.length).toBe(1);
    expect(svcs[0].name).toBe('web');
    expect(svcs[0].image).toBe('nginx:latest');
  });

  it('parses ports', () => {
    const svcs = parseDockerCompose(simpleCompose);
    expect(svcs[0].ports).toContain('80:80');
    expect(svcs[0].ports).toContain('443:443');
  });

  it('parses volumes', () => {
    const svcs = parseDockerCompose(simpleCompose);
    expect(svcs[0].volumes).toContain('./html:/usr/share/nginx/html');
  });

  it('parses restart', () => {
    const svcs = parseDockerCompose(simpleCompose);
    expect(svcs[0].restart).toBe('always');
  });

  it('parses container_name', () => {
    const svcs = parseDockerCompose(simpleCompose);
    expect(svcs[0].containerName).toBe('my-nginx');
  });

  it('parses multiple services', () => {
    const svcs = parseDockerCompose(multiCompose);
    expect(svcs.length).toBe(2);
    expect(svcs[0].name).toBe('db');
    expect(svcs[1].name).toBe('app');
  });

  it('parses environment list', () => {
    const svcs = parseDockerCompose(multiCompose);
    expect(svcs[0].environment).toContain('POSTGRES_USER=admin');
  });
});

describe('serviceToDockerRun', () => {
  it('includes docker run', () => {
    const svcs = parseDockerCompose(simpleCompose);
    const cmd = serviceToDockerRun(svcs[0]);
    expect(cmd).toContain('docker run');
  });

  it('includes image', () => {
    const svcs = parseDockerCompose(simpleCompose);
    const cmd = serviceToDockerRun(svcs[0]);
    expect(cmd).toContain('nginx:latest');
  });

  it('includes port flags', () => {
    const svcs = parseDockerCompose(simpleCompose);
    const cmd = serviceToDockerRun(svcs[0]);
    expect(cmd).toContain('-p 80:80');
  });

  it('includes restart flag', () => {
    const svcs = parseDockerCompose(simpleCompose);
    const cmd = serviceToDockerRun(svcs[0]);
    expect(cmd).toContain('--restart always');
  });

  it('includes container name', () => {
    const svcs = parseDockerCompose(simpleCompose);
    const cmd = serviceToDockerRun(svcs[0]);
    expect(cmd).toContain('--name my-nginx');
  });

  it('handles missing image', () => {
    const result = serviceToDockerRun({
      name: 'noimage', image: '', ports: [], volumes: [], environment: [],
      command: '', networks: [], restart: '', containerName: '', entrypoint: '',
      privileged: false, user: '', workdir: '', capAdd: [], memLimit: '', cpus: '',
    });
    expect(result).toContain('no image specified');
  });
});

describe('processDockerCompose', () => {
  it('converts single service', () => {
    const out = processDockerCompose(simpleCompose);
    expect(out).toContain('# Service: web');
    expect(out).toContain('docker run');
    expect(out).toContain('nginx:latest');
  });

  it('converts multiple services', () => {
    const out = processDockerCompose(multiCompose);
    expect(out).toContain('# Service: db');
    expect(out).toContain('# Service: app');
  });

  it('throws on empty input', () => {
    expect(() => processDockerCompose('')).toThrow();
  });

  it('throws when no services found', () => {
    expect(() => processDockerCompose('version: "3"')).toThrow('No services found');
  });
});
