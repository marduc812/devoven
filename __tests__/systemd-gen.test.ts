import {
  generateSystemdUnit,
  parseSystemdGenInput,
  ServiceType,
} from '../Components/Functions/SystemdGenTools/logic';

describe('parseSystemdGenInput', () => {
  test('parses description', () => {
    const opts = parseSystemdGenInput('description=My App\nexec_start=/usr/bin/app', 'simple');
    expect(opts.description).toBe('My App');
    expect(opts.execStart).toBe('/usr/bin/app');
  });

  test('parses user and group', () => {
    const opts = parseSystemdGenInput('user=appuser\ngroup=appgroup', 'simple');
    expect(opts.user).toBe('appuser');
    expect(opts.group).toBe('appgroup');
  });

  test('parses restart policy', () => {
    const opts = parseSystemdGenInput('restart=always', 'simple');
    expect(opts.restart).toBe('always');
  });

  test('ignores invalid restart policy', () => {
    const opts = parseSystemdGenInput('restart=invalid-value', 'simple');
    expect(opts.restart).toBe('on-failure'); // default
  });

  test('parses environment variables', () => {
    const opts = parseSystemdGenInput('environment=NODE_ENV=production,PORT=3000', 'simple');
    expect(opts.environment).toBe('NODE_ENV=production,PORT=3000');
  });

  test('ignores comments and blank lines', () => {
    const opts = parseSystemdGenInput('# comment\n\ndescription=Test', 'simple');
    expect(opts.description).toBe('Test');
  });
});

describe('generateSystemdUnit', () => {
  test('contains [Unit] section', () => {
    const output = generateSystemdUnit('description=Test\nexec_start=/usr/bin/app', 'simple');
    expect(output).toContain('[Unit]');
    expect(output).toContain('Description=Test');
  });

  test('contains [Service] section', () => {
    const output = generateSystemdUnit('exec_start=/usr/bin/app', 'simple');
    expect(output).toContain('[Service]');
    expect(output).toContain('ExecStart=/usr/bin/app');
  });

  test('contains [Install] section', () => {
    const output = generateSystemdUnit('exec_start=/usr/bin/app', 'simple');
    expect(output).toContain('[Install]');
    expect(output).toContain('WantedBy=multi-user.target');
  });

  test('includes User when set', () => {
    const output = generateSystemdUnit('exec_start=/usr/bin/app\nuser=myuser', 'simple');
    expect(output).toContain('User=myuser');
  });

  test('includes WorkingDirectory when set', () => {
    const output = generateSystemdUnit('exec_start=/app\nworking_directory=/var/app', 'simple');
    expect(output).toContain('WorkingDirectory=/var/app');
  });

  test('includes Environment pairs when set', () => {
    const output = generateSystemdUnit('exec_start=/app\nenvironment=NODE_ENV=prod,PORT=3000', 'simple');
    expect(output).toContain('Environment="NODE_ENV=prod"');
    expect(output).toContain('Environment="PORT=3000"');
  });

  test('oneshot type adds RemainAfterExit', () => {
    const output = generateSystemdUnit('exec_start=/usr/bin/job', 'oneshot');
    expect(output).toContain('Type=oneshot');
    expect(output).toContain('RemainAfterExit=yes');
  });

  test('forking type adds PID file comment when not set', () => {
    const output = generateSystemdUnit('exec_start=/usr/bin/daemon', 'forking');
    expect(output).toContain('Type=forking');
    expect(output).toContain('PIDFile');
  });

  test('After directive is included', () => {
    const output = generateSystemdUnit('exec_start=/app\nafter=network.target postgresql.service', 'simple');
    expect(output).toContain('After=network.target postgresql.service');
  });

  test('restartSec is included', () => {
    const output = generateSystemdUnit('exec_start=/app\nrestart_sec=10', 'simple');
    expect(output).toContain('RestartSec=10');
  });
});

describe('service type handling', () => {
  const types: ServiceType[] = ['simple', 'oneshot', 'forking', 'notify', 'dbus', 'idle'];
  for (const t of types) {
    test('generates valid output for type: ' + t, () => {
      const output = generateSystemdUnit('exec_start=/usr/bin/app', t);
      expect(output).toContain('Type=' + t);
    });
  }
});
