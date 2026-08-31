// The form-driven tools call the object builders directly; the key=value entry
// points parse into the same functions, so both paths must agree.
import {
  buildSystemdUnit,
  generateSystemdUnit,
  parseSystemdGenInput,
  systemdFilename,
  SYSTEMD_DEFAULTS,
  SYSTEMD_GEN_EXAMPLE,
} from '../Components/Functions/SystemdGenTools/logic';
import {
  buildHtaccess,
  generateHtaccess,
  parseHtaccessInput,
  HTACCESS_DEFAULTS,
  HTACCESS_EXAMPLE,
} from '../Components/Functions/HtaccessTools/logic';

describe('buildSystemdUnit', () => {
  it('matches the string entry point for the example input', () => {
    expect(buildSystemdUnit(parseSystemdGenInput(SYSTEMD_GEN_EXAMPLE, 'simple')))
      .toBe(generateSystemdUnit(SYSTEMD_GEN_EXAMPLE, 'simple'));
  });

  it('builds the three sections from an options object', () => {
    const unit = buildSystemdUnit({ ...SYSTEMD_DEFAULTS, description: 'Widget API' });
    expect(unit).toContain('[Unit]');
    expect(unit).toContain('Description=Widget API');
    expect(unit).toContain('[Service]');
    expect(unit).toContain('[Install]');
    expect(unit).toContain('WantedBy=multi-user.target');
  });

  it('splits comma-separated Environment into one line each', () => {
    const unit = buildSystemdUnit({
      ...SYSTEMD_DEFAULTS,
      environment: 'NODE_ENV=production,PORT=3000',
    });
    expect(unit).toContain('Environment="NODE_ENV=production"');
    expect(unit).toContain('Environment="PORT=3000"');
  });

  it('comments the missing PIDFile for a forking service', () => {
    const unit = buildSystemdUnit({ ...SYSTEMD_DEFAULTS, serviceType: 'forking', pidFile: '' });
    expect(unit).toContain('# PIDFile=');
    expect(unit).toContain('required for forking services');
  });

  it('uses the PIDFile when a forking service supplies one', () => {
    const unit = buildSystemdUnit({
      ...SYSTEMD_DEFAULTS, serviceType: 'forking', pidFile: '/var/run/app.pid',
    });
    expect(unit).toContain('PIDFile=/var/run/app.pid');
    expect(unit).not.toContain('# PIDFile=');
  });

  it('adds RemainAfterExit for oneshot only', () => {
    expect(buildSystemdUnit({ ...SYSTEMD_DEFAULTS, serviceType: 'oneshot' }))
      .toContain('RemainAfterExit=yes');
    expect(buildSystemdUnit({ ...SYSTEMD_DEFAULTS, serviceType: 'simple' }))
      .not.toContain('RemainAfterExit');
  });

  it('omits zero timeouts', () => {
    const unit = buildSystemdUnit({ ...SYSTEMD_DEFAULTS, timeoutStartSec: 0, timeoutStopSec: 0 });
    expect(unit).not.toContain('TimeoutStartSec');
    expect(unit).not.toContain('TimeoutStopSec');
  });

  it('falls back to simple for an unknown service type', () => {
    const unit = buildSystemdUnit({ ...SYSTEMD_DEFAULTS, serviceType: 'bogus' as never });
    expect(unit).toContain('Type=simple');
  });
});

describe('systemdFilename', () => {
  it('slugifies the description', () => {
    expect(systemdFilename({ ...SYSTEMD_DEFAULTS, description: 'My Node.js Application' }))
      .toBe('my-node-js-application.service');
  });
  it('falls back when the description has nothing usable', () => {
    expect(systemdFilename({ ...SYSTEMD_DEFAULTS, description: '   ' })).toBe('my-service.service');
    expect(systemdFilename({ ...SYSTEMD_DEFAULTS, description: '///' })).toBe('my-service.service');
  });
  it('caps the length', () => {
    const long = systemdFilename({ ...SYSTEMD_DEFAULTS, description: 'a'.repeat(200) });
    expect(long.length).toBeLessThanOrEqual(60 + '.service'.length);
  });
});

describe('buildHtaccess', () => {
  it('matches the string entry point for the example input', () => {
    expect(buildHtaccess(parseHtaccessInput(HTACCESS_EXAMPLE)))
      .toBe(generateHtaccess(HTACCESS_EXAMPLE));
  });

  it('emits the HTTPS rule when asked', () => {
    const out = buildHtaccess({ ...HTACCESS_DEFAULTS, https_redirect: 'yes' });
    expect(out).toContain('RewriteEngine On');
    expect(out).toContain('RewriteCond %{HTTPS} off');
  });

  it('drops both www rules when they are set at once', () => {
    const out = buildHtaccess({ ...HTACCESS_DEFAULTS, www_redirect: 'yes', no_www_redirect: 'yes' });
    expect(out).not.toContain('Redirect to www');
    expect(out).not.toContain('Redirect to non-www');
  });

  it('skips a half-filled custom redirect', () => {
    const out = buildHtaccess({ ...HTACCESS_DEFAULTS, custom_redirect_from: 'old' });
    expect(out).not.toContain('Custom redirect');
  });

  it('honours the redirect status code', () => {
    const base = { ...HTACCESS_DEFAULTS, custom_redirect_from: 'old', custom_redirect_to: '/new' };
    expect(buildHtaccess({ ...base, redirect_type: '302' })).toContain('R=302');
    expect(buildHtaccess({ ...base, redirect_type: '301' })).toContain('R=301');
    // Anything unrecognised falls back to a permanent redirect.
    expect(buildHtaccess({ ...base, redirect_type: '418' })).toContain('R=301');
  });

  it('emits one Require not ip line per blocked address', () => {
    const out = buildHtaccess({ ...HTACCESS_DEFAULTS, block_ips: '10.0.0.1, 10.0.0.2 ,  ' });
    expect(out).toContain('Require not ip 10.0.0.1');
    expect(out).toContain('Require not ip 10.0.0.2');
    expect(out.match(/Require not ip/g)).toHaveLength(2);
  });

  it('disables directory listing by default and can leave it on', () => {
    expect(buildHtaccess(HTACCESS_DEFAULTS)).toContain('Options -Indexes');
    expect(buildHtaccess({ ...HTACCESS_DEFAULTS, directory_listing: 'yes' }))
      .not.toContain('Options -Indexes');
  });
});
