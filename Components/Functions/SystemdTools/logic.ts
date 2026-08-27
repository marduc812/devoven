// ── systemd Service Generator ─────────────────────────────────────────────────

export interface SystemdOptions {
  description: string;
  exec_start: string;
  user: string;
  working_dir: string;
  env: string;
  restart: string;
  type: string;
  after: string;
  wants: string;
  requires: string;
  environment_file: string;
  std_output: string;
  std_error: string;
}

export function parseSystemdInput(input: string): SystemdOptions {
  const opts: SystemdOptions = {
    description: 'My Application Service',
    exec_start: '/usr/bin/node /app/index.js',
    user: '',
    working_dir: '',
    env: '',
    restart: 'on-failure',
    type: 'simple',
    after: 'network.target',
    wants: '',
    requires: '',
    environment_file: '',
    std_output: 'journal',
    std_error: 'journal',
  };

  const lines = input.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim().toLowerCase();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (key in opts) {
      (opts as unknown as Record<string, string>)[key] = val;
    }
  }
  return opts;
}

const VALID_TYPES = ['simple', 'forking', 'oneshot', 'notify', 'dbus', 'idle'];
const VALID_RESTARTS = ['no', 'on-success', 'on-failure', 'on-abnormal', 'on-watchdog', 'on-abort', 'always'];

export function generateSystemdService(input: string): string {
  const opts = parseSystemdInput(input);
  const lines: string[] = [];

  const serviceType = VALID_TYPES.indexOf(opts.type) !== -1 ? opts.type : 'simple';
  const restartPolicy = VALID_RESTARTS.indexOf(opts.restart) !== -1 ? opts.restart : 'on-failure';

  // [Unit]
  lines.push('[Unit]');
  lines.push('Description=' + opts.description);
  if (opts.after) {
    lines.push('After=' + opts.after);
  }
  if (opts.wants) {
    lines.push('Wants=' + opts.wants);
  }
  if (opts.requires) {
    lines.push('Requires=' + opts.requires);
  }
  lines.push('');

  // [Service]
  lines.push('[Service]');
  lines.push('Type=' + serviceType);
  if (opts.user) {
    lines.push('User=' + opts.user);
  }
  if (opts.working_dir) {
    lines.push('WorkingDirectory=' + opts.working_dir);
  }

  // Environment variables
  const envVars = opts.env
    .split(',')
    .map(function(e) { return e.trim(); })
    .filter(function(e) { return e.includes('='); });
  for (const ev of envVars) {
    lines.push('Environment=' + ev);
  }

  if (opts.environment_file) {
    lines.push('EnvironmentFile=' + opts.environment_file);
  }

  lines.push('ExecStart=' + opts.exec_start);
  lines.push('Restart=' + restartPolicy);
  lines.push('RestartSec=5');

  if (opts.std_output) {
    lines.push('StandardOutput=' + opts.std_output);
  }
  if (opts.std_error) {
    lines.push('StandardError=' + opts.std_error);
  }
  lines.push('');

  // [Install]
  lines.push('[Install]');
  lines.push('WantedBy=multi-user.target');

  return lines.join('\n');
}

export const SYSTEMD_EXAMPLE = `description=My Node.js App
exec_start=/usr/bin/node /var/app/index.js
user=nodeuser
working_dir=/var/app
env=NODE_ENV=production,PORT=3000
restart=on-failure
type=simple
after=network.target`;
