export interface DockerService {
  name: string;
  image: string;
  ports: string[];
  volumes: string[];
  environment: string[];
  command: string;
  networks: string[];
  restart: string;
  containerName: string;
  entrypoint: string;
  privileged: boolean;
  user: string;
  workdir: string;
  capAdd: string[];
  memLimit: string;
  cpus: string;
}

// Minimal YAML-like line-by-line parser for docker-compose service blocks
export function parseDockerCompose(input: string): DockerService[] {
  const lines = input.split('\n');
  const services: DockerService[] = [];
  let inServices = false;
  let currentService: DockerService | null = null;
  let currentKey = '';
  let serviceIndent = -1;
  let keyIndent = -1;

  function indent(line: string): number {
    let i = 0;
    while (i < line.length && line[i] === ' ') i++;
    return i;
  }

  function trimVal(s: string): string {
    return s.trim().replace(/^['"]|['"]$/g, '');
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trimEnd();
    if (!trimmed || trimmed.trimStart().startsWith('#')) continue;
    const ind = indent(trimmed);
    const content = trimmed.trimStart();

    // detect "services:" block
    if (/^services\s*:/.test(content)) {
      inServices = true;
      serviceIndent = -1;
      continue;
    }

    if (!inServices) continue;

    // detect other top-level keys (version, networks, volumes, etc.)
    if (ind === 0 && !/^\s/.test(trimmed) && !/^services/.test(content)) {
      inServices = false;
      continue;
    }

    // Determine indent of service names (first level under services)
    if (serviceIndent === -1 && ind > 0 && content.endsWith(':')) {
      serviceIndent = ind;
    }

    // New service
    if (ind === serviceIndent && content.endsWith(':')) {
      if (currentService) services.push(currentService);
      const svcName = content.slice(0, -1).trim();
      currentService = {
        name: svcName,
        image: '',
        ports: [],
        volumes: [],
        environment: [],
        command: '',
        networks: [],
        restart: '',
        containerName: '',
        entrypoint: '',
        privileged: false,
        user: '',
        workdir: '',
        capAdd: [],
        memLimit: '',
        cpus: '',
      };
      currentKey = '';
      keyIndent = -1;
      continue;
    }

    if (!currentService) continue;

    // Key-value inside service
    const kvMatch = content.match(/^([a-z_]+(?:[-_][a-z_]+)*):\s*(.*)/);
    if (kvMatch && ind > serviceIndent) {
      const k = kvMatch[1];
      const v = trimVal(kvMatch[2]);
      keyIndent = ind;
      currentKey = k;

      if (k === 'image') currentService.image = v;
      else if (k === 'command') currentService.command = v;
      else if (k === 'restart') currentService.restart = v;
      else if (k === 'container_name') currentService.containerName = v;
      else if (k === 'entrypoint') currentService.entrypoint = v;
      else if (k === 'privileged') currentService.privileged = v === 'true';
      else if (k === 'user') currentService.user = v;
      else if (k === 'working_dir') currentService.workdir = v;
      else if (k === 'mem_limit') currentService.memLimit = v;
      else if (k === 'cpus') currentService.cpus = v;
      continue;
    }

    // List items
    const listMatch = content.match(/^-\s+(.*)/);
    if (listMatch && ind > serviceIndent) {
      const val = trimVal(listMatch[1]);
      if (currentKey === 'ports') currentService.ports.push(val);
      else if (currentKey === 'volumes') currentService.volumes.push(val);
      else if (currentKey === 'environment') currentService.environment.push(val);
      else if (currentKey === 'networks') currentService.networks.push(val);
      else if (currentKey === 'cap_add') currentService.capAdd.push(val);
      continue;
    }

    // environment as key: value (under environment: key)
    const envKv = content.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)/);
    if (envKv && currentKey === 'environment' && ind > serviceIndent) {
      currentService.environment.push(envKv[1] + '=' + trimVal(envKv[2]));
    }
  }

  if (currentService) services.push(currentService);
  return services;
}

export function serviceToDockerRun(svc: DockerService): string {
  if (!svc.image) return '# Service "' + svc.name + '" has no image specified';

  const parts = ['docker run'];

  if (svc.containerName) parts.push('--name ' + svc.containerName);
  else parts.push('--name ' + svc.name);

  if (svc.restart) parts.push('--restart ' + svc.restart);

  for (let i = 0; i < svc.ports.length; i++) {
    parts.push('-p ' + svc.ports[i]);
  }

  for (let i = 0; i < svc.volumes.length; i++) {
    parts.push('-v ' + svc.volumes[i]);
  }

  for (let i = 0; i < svc.environment.length; i++) {
    parts.push('-e ' + svc.environment[i]);
  }

  for (let i = 0; i < svc.networks.length; i++) {
    parts.push('--network ' + svc.networks[i]);
  }

  for (let i = 0; i < svc.capAdd.length; i++) {
    parts.push('--cap-add ' + svc.capAdd[i]);
  }

  if (svc.privileged) parts.push('--privileged');
  if (svc.user) parts.push('--user ' + svc.user);
  if (svc.workdir) parts.push('-w ' + svc.workdir);
  if (svc.memLimit) parts.push('--memory ' + svc.memLimit);
  if (svc.cpus) parts.push('--cpus=' + svc.cpus);
  if (svc.entrypoint) parts.push('--entrypoint ' + svc.entrypoint);

  parts.push(svc.image);

  if (svc.command) parts.push(svc.command);

  return parts.join(' \\\n  ');
}

export function processDockerCompose(input: string): string {
  if (!input.trim()) throw new Error('No input provided');
  const services = parseDockerCompose(input);
  if (services.length === 0) throw new Error('No services found. Make sure the YAML has a "services:" block.');
  return services.map(function(s) {
    return '# Service: ' + s.name + '\n' + serviceToDockerRun(s);
  }).join('\n\n');
}
