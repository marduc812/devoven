import { execFileSync } from 'node:child_process';
import path from 'node:path';

const { assertSupportedNode } = require('../scripts/check-node.cjs');

describe('Node security minimum', () => {
  it.each(['22.23.4', '22.23.5', '22.24.0', '22.30.0'])('accepts patched Node %s', version => {
    expect(() => assertSupportedNode(version)).not.toThrow();
  });

  it.each(['20.20.2', '22.13.0', '22.22.9', '22.23.3', '24.22.0', '24.22.1', '26.12.1', '22.23.4-rc.1', 'invalid'])('rejects unsupported Node %s', version => {
    expect(() => assertSupportedNode(version)).toThrow('requires Node.js >=22.23.4 <23');
  });

  it('checks the actual process version by default', () => {
    expect(() => assertSupportedNode()).not.toThrow();
  });

  it('rejects a vulnerable runtime when Next loads its configuration', () => {
    const config = path.resolve(__dirname, '../next.config.js');
    expect(() => execFileSync(process.execPath, ['-e',
      `Object.defineProperty(process.versions, 'node', { value: '22.23.3' }); require(${JSON.stringify(config)});`,
    ], { stdio: 'pipe' })).toThrow(/requires Node.js >=22.23.4 <23/);
  });
});
