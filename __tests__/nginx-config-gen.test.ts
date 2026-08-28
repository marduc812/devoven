import { generateNginxConfig, getExampleInput, NginxTemplate } from '@/Components/Functions/NginxConfigGenTools/logic';

describe('generateNginxConfig - reverse-proxy', () => {
  it('generates server block with proxy_pass', () => {
    const input = 'domain=myapp.com\nproxy_target=http://localhost:3000';
    const result = generateNginxConfig(input, 'reverse-proxy');
    expect(result).toContain('server {');
    expect(result).toContain('proxy_pass');
    expect(result).toContain('myapp.com');
  });

  it('includes gzip when enabled', () => {
    const input = 'domain=example.com\nproxy_target=http://localhost:3000\ngzip=true';
    const result = generateNginxConfig(input, 'reverse-proxy');
    expect(result).toContain('gzip on;');
  });

  it('includes SSL block when ssl=true', () => {
    const input = 'domain=example.com\nproxy_target=http://localhost:3000\nssl=true';
    const result = generateNginxConfig(input, 'reverse-proxy');
    expect(result).toContain('ssl_certificate');
    expect(result).toContain('443 ssl');
  });

  it('includes www redirect block', () => {
    const input = 'domain=example.com\nproxy_target=http://localhost:3000\nwww_redirect=true';
    const result = generateNginxConfig(input, 'reverse-proxy');
    expect(result).toContain('www.example.com');
  });
});

describe('generateNginxConfig - static-site', () => {
  it('generates root and try_files', () => {
    const input = 'domain=mysite.com\nstatic_files=/var/www/html';
    const result = generateNginxConfig(input, 'static-site');
    expect(result).toContain('root');
    expect(result).toContain('try_files');
    expect(result).toContain('/var/www/html');
  });

  it('includes cache control for static assets', () => {
    const input = 'domain=mysite.com\nstatic_files=/var/www/html';
    const result = generateNginxConfig(input, 'static-site');
    expect(result).toContain('Cache-Control');
  });
});

describe('generateNginxConfig - php-fpm', () => {
  it('generates fastcgi_pass block', () => {
    const input = 'domain=wordpress.com\nphp_socket=/var/run/php/php8.2-fpm.sock\nstatic_files=/var/www/wp';
    const result = generateNginxConfig(input, 'php-fpm');
    expect(result).toContain('fastcgi_pass');
    expect(result).toContain('php8.2-fpm.sock');
  });
});

describe('generateNginxConfig - redirect', () => {
  it('generates redirect server block', () => {
    const input = 'domain=old.com\nredirect_to=https://new.com$request_uri';
    const result = generateNginxConfig(input, 'redirect');
    expect(result).toContain('return 301');
    expect(result).toContain('https://new.com');
  });
});

describe('getExampleInput', () => {
  const templates: NginxTemplate[] = ['reverse-proxy', 'static-site', 'php-fpm', 'redirect'];
  templates.forEach(t => {
    it(`returns non-empty example for ${t}`, () => {
      expect(getExampleInput(t).length).toBeGreaterThan(0);
    });
  });
});
