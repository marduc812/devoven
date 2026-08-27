import {
  parseSystemdInput,
  generateSystemdService,
  SYSTEMD_EXAMPLE,
} from '../Components/Functions/SystemdTools/logic';

describe('parseSystemdInput', () => {
  it('parses description and exec_start', () => {
    const opts = parseSystemdInput('description=My App\nexec_start=/usr/bin/node app.js');
    expect(opts.description).toBe('My App');
    expect(opts.exec_start).toBe('/usr/bin/node app.js');
  });

  it('uses defaults for missing fields', () => {
    const opts = parseSystemdInput('description=Test');
    expect(opts.type).toBe('simple');
    expect(opts.restart).toBe('on-failure');
    expect(opts.after).toBe('network.target');
  });

  it('ignores comment lines', () => {
    const opts = parseSystemdInput('# comment\ndescription=App');
    expect(opts.description).toBe('App');
  });
});

describe('generateSystemdService', () => {
  it('generates [Unit] section', () => {
    const out = generateSystemdService('description=Test App');
    expect(out).toContain('[Unit]');
    expect(out).toContain('Description=Test App');
  });

  it('generates [Service] section', () => {
    const out = generateSystemdService('exec_start=/usr/bin/myapp');
    expect(out).toContain('[Service]');
    expect(out).toContain('ExecStart=/usr/bin/myapp');
  });

  it('generates [Install] section', () => {
    const out = generateSystemdService('description=X');
    expect(out).toContain('[Install]');
    expect(out).toContain('WantedBy=multi-user.target');
  });

  it('includes User and WorkingDirectory when set', () => {
    const out = generateSystemdService('user=appuser\nworking_dir=/var/app');
    expect(out).toContain('User=appuser');
    expect(out).toContain('WorkingDirectory=/var/app');
  });

  it('includes Environment lines for env vars', () => {
    const out = generateSystemdService('env=NODE_ENV=production,PORT=3000');
    expect(out).toContain('Environment=NODE_ENV=production');
    expect(out).toContain('Environment=PORT=3000');
  });

  it('includes After= directive', () => {
    const out = generateSystemdService('after=network.target postgresql.service');
    expect(out).toContain('After=network.target postgresql.service');
  });

  it('uses valid restart policy', () => {
    const out = generateSystemdService('restart=always');
    expect(out).toContain('Restart=always');
  });

  it('falls back to on-failure for invalid restart policy', () => {
    const out = generateSystemdService('restart=invalid-policy');
    expect(out).toContain('Restart=on-failure');
  });

  it('generates full example without error', () => {
    const out = generateSystemdService(SYSTEMD_EXAMPLE);
    expect(out).toContain('[Unit]');
    expect(out).toContain('[Service]');
    expect(out).toContain('[Install]');
  });
});
