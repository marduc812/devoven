import {
  parseK8sInput,
  generateDeployment,
  generateService,
  generateIngress,
  generateConfigMap,
  generateSecret,
  generateK8sYaml,
  K8S_EXAMPLE,
} from '../Components/Functions/K8sYamlTools/logic';

describe('parseK8sInput', () => {
  it('parses name and image', () => {
    const opts = parseK8sInput('name=web\nimage=nginx:1.25');
    expect(opts.name).toBe('web');
    expect(opts.image).toBe('nginx:1.25');
  });

  it('uses defaults for missing fields', () => {
    const opts = parseK8sInput('name=web');
    expect(opts.namespace).toBe('default');
    expect(opts.replicas).toBe('2');
  });
});

describe('generateDeployment', () => {
  it('generates apiVersion and kind', () => {
    const opts = parseK8sInput('name=web\nimage=nginx:latest');
    const out = generateDeployment(opts);
    expect(out).toContain('apiVersion: apps/v1');
    expect(out).toContain('kind: Deployment');
    expect(out).toContain('name: web');
    expect(out).toContain('image: nginx:latest');
  });

  it('includes resource limits', () => {
    const opts = parseK8sInput('name=web\ncpu_limit=1000m\nmemory_limit=1Gi');
    const out = generateDeployment(opts);
    expect(out).toContain('cpu: 1000m');
    expect(out).toContain('memory: 1Gi');
  });

  it('includes env vars', () => {
    const opts = parseK8sInput('name=web\nenv=FOO=bar,BAZ=qux');
    const out = generateDeployment(opts);
    expect(out).toContain('name: FOO');
    expect(out).toContain('value: "bar"');
  });
});

describe('generateService', () => {
  it('generates ClusterIP service by default', () => {
    const opts = parseK8sInput('name=web');
    const out = generateService(opts);
    expect(out).toContain('kind: Service');
    expect(out).toContain('type: ClusterIP');
  });

  it('generates NodePort service', () => {
    const opts = parseK8sInput('name=web\nservice_type=NodePort');
    const out = generateService(opts);
    expect(out).toContain('type: NodePort');
    expect(out).toContain('nodePort: 30080');
  });
});

describe('generateIngress', () => {
  it('generates ingress with host', () => {
    const opts = parseK8sInput('name=web\ningress_host=example.com');
    const out = generateIngress(opts);
    expect(out).toContain('kind: Ingress');
    expect(out).toContain('host: example.com');
  });

  it('generates TLS section when ingress_tls=yes', () => {
    const opts = parseK8sInput('name=web\ningress_host=secure.com\ningress_tls=yes');
    const out = generateIngress(opts);
    expect(out).toContain('tls:');
    expect(out).toContain('secretName: web-tls');
  });
});

describe('generateConfigMap', () => {
  it('generates configmap with data', () => {
    const opts = parseK8sInput('name=app\nconfig_data=KEY1=val1,KEY2=val2');
    const out = generateConfigMap(opts);
    expect(out).toContain('kind: ConfigMap');
    expect(out).toContain('KEY1: "val1"');
  });
});

describe('generateSecret', () => {
  it('generates secret with base64 encoded values', () => {
    const opts = parseK8sInput('name=app\nsecret_data=PASSWORD=secret123');
    const out = generateSecret(opts);
    expect(out).toContain('kind: Secret');
    expect(out).toContain('type: Opaque');
    expect(out).toContain('PASSWORD: ' + Buffer.from('secret123').toString('base64'));
  });
});

describe('generateK8sYaml', () => {
  it('dispatches to correct generator', () => {
    expect(generateK8sYaml(K8S_EXAMPLE, 'Deployment')).toContain('kind: Deployment');
    expect(generateK8sYaml(K8S_EXAMPLE, 'Service')).toContain('kind: Service');
    expect(generateK8sYaml(K8S_EXAMPLE, 'Ingress')).toContain('kind: Ingress');
    expect(generateK8sYaml(K8S_EXAMPLE, 'ConfigMap')).toContain('kind: ConfigMap');
    expect(generateK8sYaml(K8S_EXAMPLE, 'Secret')).toContain('kind: Secret');
  });
});
