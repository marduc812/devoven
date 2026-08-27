// ── Kubernetes YAML Generator ─────────────────────────────────────────────────

export type K8sResourceType = 'Deployment' | 'Service' | 'Ingress' | 'ConfigMap' | 'Secret';

export interface K8sOptions {
  name: string;
  namespace: string;
  image: string;
  replicas: string;
  port: string;
  service_type: string;
  service_port: string;
  env: string;
  cpu_request: string;
  memory_request: string;
  cpu_limit: string;
  memory_limit: string;
  ingress_host: string;
  ingress_path: string;
  ingress_service: string;
  ingress_tls: string;
  config_data: string;
  secret_data: string;
}

export function parseK8sInput(input: string): K8sOptions {
  const opts: K8sOptions = {
    name: 'my-app',
    namespace: 'default',
    image: 'nginx:latest',
    replicas: '2',
    port: '80',
    service_type: 'ClusterIP',
    service_port: '80',
    env: '',
    cpu_request: '100m',
    memory_request: '128Mi',
    cpu_limit: '500m',
    memory_limit: '512Mi',
    ingress_host: 'example.com',
    ingress_path: '/',
    ingress_service: '',
    ingress_tls: 'no',
    config_data: '',
    secret_data: '',
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

export function generateDeployment(opts: K8sOptions): string {
  const envVars = opts.env
    .split(',')
    .map(function(e) { return e.trim(); })
    .filter(function(e) { return e.includes('='); });

  const lines: string[] = [];
  lines.push('apiVersion: apps/v1');
  lines.push('kind: Deployment');
  lines.push('metadata:');
  lines.push('  name: ' + opts.name);
  lines.push('  namespace: ' + opts.namespace);
  lines.push('spec:');
  lines.push('  replicas: ' + (parseInt(opts.replicas, 10) || 2));
  lines.push('  selector:');
  lines.push('    matchLabels:');
  lines.push('      app: ' + opts.name);
  lines.push('  template:');
  lines.push('    metadata:');
  lines.push('      labels:');
  lines.push('        app: ' + opts.name);
  lines.push('    spec:');
  lines.push('      containers:');
  lines.push('        - name: ' + opts.name);
  lines.push('          image: ' + opts.image);
  lines.push('          ports:');
  lines.push('            - containerPort: ' + (parseInt(opts.port, 10) || 80));
  if (envVars.length > 0) {
    lines.push('          env:');
    for (const ev of envVars) {
      const eqI = ev.indexOf('=');
      const envName = ev.slice(0, eqI).trim();
      const envVal = ev.slice(eqI + 1).trim();
      lines.push('            - name: ' + envName);
      lines.push('              value: "' + envVal + '"');
    }
  }
  lines.push('          resources:');
  lines.push('            requests:');
  lines.push('              cpu: ' + opts.cpu_request);
  lines.push('              memory: ' + opts.memory_request);
  lines.push('            limits:');
  lines.push('              cpu: ' + opts.cpu_limit);
  lines.push('              memory: ' + opts.memory_limit);

  return lines.join('\n');
}

export function generateService(opts: K8sOptions): string {
  const svcType = ['ClusterIP', 'NodePort', 'LoadBalancer'].indexOf(opts.service_type) !== -1
    ? opts.service_type
    : 'ClusterIP';

  const lines: string[] = [];
  lines.push('apiVersion: v1');
  lines.push('kind: Service');
  lines.push('metadata:');
  lines.push('  name: ' + opts.name + '-svc');
  lines.push('  namespace: ' + opts.namespace);
  lines.push('spec:');
  lines.push('  type: ' + svcType);
  lines.push('  selector:');
  lines.push('    app: ' + opts.name);
  lines.push('  ports:');
  lines.push('    - protocol: TCP');
  lines.push('      port: ' + (parseInt(opts.service_port, 10) || 80));
  lines.push('      targetPort: ' + (parseInt(opts.port, 10) || 80));
  if (svcType === 'NodePort') {
    lines.push('      nodePort: 30080');
  }

  return lines.join('\n');
}

export function generateIngress(opts: K8sOptions): string {
  const svcName = opts.ingress_service || opts.name + '-svc';
  const svcPort = parseInt(opts.service_port, 10) || 80;
  const hasTls = opts.ingress_tls === 'yes';

  const lines: string[] = [];
  lines.push('apiVersion: networking.k8s.io/v1');
  lines.push('kind: Ingress');
  lines.push('metadata:');
  lines.push('  name: ' + opts.name + '-ingress');
  lines.push('  namespace: ' + opts.namespace);
  lines.push('  annotations:');
  lines.push('    nginx.ingress.kubernetes.io/rewrite-target: /');
  lines.push('spec:');
  if (hasTls) {
    lines.push('  tls:');
    lines.push('    - hosts:');
    lines.push('        - ' + opts.ingress_host);
    lines.push('      secretName: ' + opts.name + '-tls');
  }
  lines.push('  rules:');
  lines.push('    - host: ' + opts.ingress_host);
  lines.push('      http:');
  lines.push('        paths:');
  lines.push('          - path: ' + (opts.ingress_path || '/'));
  lines.push('            pathType: Prefix');
  lines.push('            backend:');
  lines.push('              service:');
  lines.push('                name: ' + svcName);
  lines.push('                port:');
  lines.push('                  number: ' + svcPort);

  return lines.join('\n');
}

export function generateConfigMap(opts: K8sOptions): string {
  const dataItems = opts.config_data
    .split(',')
    .map(function(e) { return e.trim(); })
    .filter(function(e) { return e.includes('='); });

  const lines: string[] = [];
  lines.push('apiVersion: v1');
  lines.push('kind: ConfigMap');
  lines.push('metadata:');
  lines.push('  name: ' + opts.name + '-config');
  lines.push('  namespace: ' + opts.namespace);
  lines.push('data:');
  if (dataItems.length > 0) {
    for (const item of dataItems) {
      const eqI = item.indexOf('=');
      const k = item.slice(0, eqI).trim();
      const v = item.slice(eqI + 1).trim();
      lines.push('  ' + k + ': "' + v + '"');
    }
  } else {
    lines.push('  KEY: value');
  }

  return lines.join('\n');
}

export function generateSecret(opts: K8sOptions): string {
  const dataItems = opts.secret_data
    .split(',')
    .map(function(e) { return e.trim(); })
    .filter(function(e) { return e.includes('='); });

  const lines: string[] = [];
  lines.push('apiVersion: v1');
  lines.push('kind: Secret');
  lines.push('metadata:');
  lines.push('  name: ' + opts.name + '-secret');
  lines.push('  namespace: ' + opts.namespace);
  lines.push('type: Opaque');
  lines.push('data:');
  if (dataItems.length > 0) {
    for (const item of dataItems) {
      const eqI = item.indexOf('=');
      const k = item.slice(0, eqI).trim();
      const v = Buffer.from(item.slice(eqI + 1).trim()).toString('base64');
      lines.push('  ' + k + ': ' + v);
    }
  } else {
    lines.push('  # base64 encoded values');
    lines.push('  PASSWORD: ' + Buffer.from('changeme').toString('base64'));
  }

  return lines.join('\n');
}

export function generateK8sYaml(input: string, resourceType: K8sResourceType): string {
  const opts = parseK8sInput(input);
  switch (resourceType) {
    case 'Deployment': return generateDeployment(opts);
    case 'Service': return generateService(opts);
    case 'Ingress': return generateIngress(opts);
    case 'ConfigMap': return generateConfigMap(opts);
    case 'Secret': return generateSecret(opts);
    default: return generateDeployment(opts);
  }
}

export const K8S_EXAMPLE = `name=my-app
namespace=default
image=nginx:1.25
replicas=3
port=80
service_type=ClusterIP
cpu_request=100m
memory_request=128Mi
cpu_limit=500m
memory_limit=512Mi
env=APP_ENV=production,LOG_LEVEL=info`;
