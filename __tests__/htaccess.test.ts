import {
  parseHtaccessInput,
  generateHtaccess,
  HTACCESS_EXAMPLE,
} from '../Components/Functions/HtaccessTools/logic';

describe('parseHtaccessInput', () => {
  it('parses https_redirect correctly', () => {
    const opts = parseHtaccessInput('https_redirect=yes');
    expect(opts.https_redirect).toBe('yes');
  });

  it('uses defaults for omitted keys', () => {
    const opts = parseHtaccessInput('cors=yes');
    expect(opts.directory_listing).toBe('no');
    expect(opts.https_redirect).toBe('no');
  });

  it('ignores comments', () => {
    const opts = parseHtaccessInput('# comment\nhttps_redirect=yes');
    expect(opts.https_redirect).toBe('yes');
  });
});

describe('generateHtaccess', () => {
  it('generates HTTPS redirect rule', () => {
    const out = generateHtaccess('https_redirect=yes');
    expect(out).toContain('RewriteEngine On');
    expect(out).toContain('HTTPS');
    expect(out).toContain('R=301');
  });

  it('generates www redirect rule', () => {
    const out = generateHtaccess('www_redirect=yes');
    expect(out).toContain('www.');
  });

  it('generates no-www redirect rule', () => {
    const out = generateHtaccess('no_www_redirect=yes');
    expect(out).toContain('non-www');
  });

  it('disables directory listing', () => {
    const out = generateHtaccess('directory_listing=no');
    expect(out).toContain('Options -Indexes');
  });

  it('generates CORS headers', () => {
    const out = generateHtaccess('cors=yes');
    expect(out).toContain('Access-Control-Allow-Origin');
  });

  it('generates cache directives', () => {
    const out = generateHtaccess('cache=yes');
    expect(out).toContain('ExpiresActive On');
  });

  it('blocks IPs', () => {
    const out = generateHtaccess('block_ips=192.168.1.1, 10.0.0.2');
    expect(out).toContain('Require not ip 192.168.1.1');
    expect(out).toContain('Require not ip 10.0.0.2');
  });

  it('sets custom error pages', () => {
    const out = generateHtaccess('error_404=/404.html\nerror_500=/500.html');
    expect(out).toContain('ErrorDocument 404 /404.html');
    expect(out).toContain('ErrorDocument 500 /500.html');
  });

  it('generates full example without errors', () => {
    const out = generateHtaccess(HTACCESS_EXAMPLE);
    expect(out).toContain('RewriteEngine On');
    expect(out).toContain('Options -Indexes');
  });
});
