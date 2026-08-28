// ── Systemd Unit File Generator (Advanced) ──────────────────────────────────────

export type ServiceType = 'simple' | 'oneshot' | 'forking' | 'notify' | 'dbus' | 'idle';
export type RestartPolicy = 'no' | 'on-success' | 'on-failure' | 'on-abnormal' | 'on-watchdog' | 'on-abort' | 'always';

export interface SystemdGenOptions {
  // [Unit]
  description: string;
  documentation: string;
  after: string;
  wants: string;
  requires: string;
  conflicts: string;
  // [Service]
  serviceType: ServiceType;
  execStart: string;
  execStop: string;
  execReload: string;
  user: string;
  group: string;
  workingDirectory: string;
  environment: string;       // KEY=VALUE,KEY2=VALUE2
  environmentFile: string;   // path to env file
  restart: RestartPolicy;
  restartSec: number;
  timeoutStartSec: number;
  timeoutStopSec: number;
  killMode: string;
  pidFile: string;
  // [Install]
  wantedBy: string;
  requiredBy: string;
}

const DEFAULTS: SystemdGenOptions = {
  description: 'My Application Service',
  documentation: '',
  after: 'network.target',
  wants: '',
  requires: '',
  conflicts: '',
  serviceType: 'simple',
  execStart: '/usr/bin/node /app/index.js',
  execStop: '',
  execReload: '',
  user: '',
  group: '',
  workingDirectory: '',
  environment: '',
  environmentFile: '',
  restart: 'on-failure',
  restartSec: 5,
  timeoutStartSec: 0,
  timeoutStopSec: 0,
  killMode: '',
  pidFile: '',
  wantedBy: 'multi-user.target',
  requiredBy: '',
};

const VALID_TYPES: ServiceType[] = ['simple', 'oneshot', 'forking', 'notify', 'dbus', 'idle'];
const VALID_RESTARTS: RestartPolicy[] = ['no', 'on-success', 'on-failure', 'on-abnormal', 'on-watchdog', 'on-abort', 'always'];

export function parseSystemdGenInput(input: string, serviceType: ServiceType): SystemdGenOptions {
  const opts: SystemdGenOptions = Object.assign({}, DEFAULTS, { serviceType });
  for (const line of input.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim().toLowerCase().replace(/-/g, '_');
    const val = trimmed.slice(eqIdx + 1).trim();
    switch (key) {
      case 'description': opts.description = val; break;
      case 'documentation': opts.documentation = val; break;
      case 'after': opts.after = val; break;
      case 'wants': opts.wants = val; break;
      case 'requires': opts.requires = val; break;
      case 'conflicts': opts.conflicts = val; break;
      case 'exec_start': case 'execstart': opts.execStart = val; break;
      case 'exec_stop': case 'execstop': opts.execStop = val; break;
      case 'exec_reload': case 'execreload': opts.execReload = val; break;
      case 'user': opts.user = val; break;
      case 'group': opts.group = val; break;
      case 'working_directory': case 'workingdirectory': opts.workingDirectory = val; break;
      case 'environment': opts.environment = val; break;
      case 'environment_file': case 'environmentfile': opts.environmentFile = val; break;
      case 'restart': {
        const r = val as RestartPolicy;
        if (VALID_RESTARTS.indexOf(r) !== -1) opts.restart = r;
        break;
      }
      case 'restart_sec': case 'restartsec': opts.restartSec = parseInt(val, 10) || 5; break;
      case 'timeout_start_sec': case 'timeoutstartsec': opts.timeoutStartSec = parseInt(val, 10) || 0; break;
      case 'timeout_stop_sec': case 'timeoutstopsec': opts.timeoutStopSec = parseInt(val, 10) || 0; break;
      case 'kill_mode': case 'killmode': opts.killMode = val; break;
      case 'pid_file': case 'pidfile': opts.pidFile = val; break;
      case 'wanted_by': case 'wantedby': opts.wantedBy = val; break;
      case 'required_by': case 'requiredby': opts.requiredBy = val; break;
      default: break;
    }
  }
  return opts;
}

export function generateSystemdUnit(input: string, serviceType: ServiceType): string {
  const opts = parseSystemdGenInput(input, serviceType);
  const validType = VALID_TYPES.indexOf(opts.serviceType) !== -1 ? opts.serviceType : 'simple';
  const lines: string[] = [];

  // [Unit]
  lines.push('[Unit]');
  lines.push('Description=' + opts.description);
  if (opts.documentation) lines.push('Documentation=' + opts.documentation);
  if (opts.after) lines.push('After=' + opts.after);
  if (opts.wants) lines.push('Wants=' + opts.wants);
  if (opts.requires) lines.push('Requires=' + opts.requires);
  if (opts.conflicts) lines.push('Conflicts=' + opts.conflicts);
  lines.push('');

  // [Service]
  lines.push('[Service]');
  lines.push('Type=' + validType);

  if (opts.user) lines.push('User=' + opts.user);
  if (opts.group) lines.push('Group=' + opts.group);
  if (opts.workingDirectory) lines.push('WorkingDirectory=' + opts.workingDirectory);

  // Environment
  if (opts.environment) {
    const envPairs = opts.environment.split(',').map(function(e) { return e.trim(); }).filter(function(e) { return e.includes('='); });
    for (const pair of envPairs) {
      lines.push('Environment="' + pair + '"');
    }
  }
  if (opts.environmentFile) lines.push('EnvironmentFile=' + opts.environmentFile);

  lines.push('ExecStart=' + opts.execStart);
  if (opts.execStop) lines.push('ExecStop=' + opts.execStop);
  if (opts.execReload) lines.push('ExecReload=' + opts.execReload);

  // forking type needs PID file
  if (validType === 'forking' && opts.pidFile) {
    lines.push('PIDFile=' + opts.pidFile);
  } else if (validType === 'forking' && !opts.pidFile) {
    lines.push('# PIDFile=/var/run/myapp.pid  # required for forking services');
  }

  lines.push('Restart=' + opts.restart);
  lines.push('RestartSec=' + opts.restartSec);

  if (opts.timeoutStartSec > 0) lines.push('TimeoutStartSec=' + opts.timeoutStartSec);
  if (opts.timeoutStopSec > 0) lines.push('TimeoutStopSec=' + opts.timeoutStopSec);
  if (opts.killMode) lines.push('KillMode=' + opts.killMode);

  lines.push('StandardOutput=journal');
  lines.push('StandardError=journal');

  // oneshot doesn't restart
  if (validType === 'oneshot') {
    lines.push('RemainAfterExit=yes');
  }

  lines.push('');

  // [Install]
  lines.push('[Install]');
  if (opts.wantedBy) lines.push('WantedBy=' + opts.wantedBy);
  if (opts.requiredBy) lines.push('RequiredBy=' + opts.requiredBy);

  return lines.join('\n');
}

export const SYSTEMD_GEN_EXAMPLE = `description=My Node.js Application
exec_start=/usr/bin/node /var/app/server.js
user=appuser
group=appgroup
working_directory=/var/app
environment=NODE_ENV=production,PORT=3000
environment_file=/etc/myapp/env
after=network.target postgresql.service
restart=on-failure
restart_sec=10
timeout_start_sec=30`;

export const SERVICE_TYPE_DESCRIPTIONS: Record<ServiceType, string> = {
  simple: 'Process started immediately, stays in foreground (default)',
  oneshot: 'Process runs once and exits, service considered active after exit',
  forking: 'Process forks a child and parent exits (traditional daemons)',
  notify: 'Like simple, but waits for sd_notify() call before ready',
  dbus: 'Process acquires a D-Bus name on startup',
  idle: 'Delayed start until all other jobs complete',
};
