import type { Config } from 'jest';
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({ dir: './' });

// Packages that ship ESM only. next/jest tells Jest to skip transforming
// node_modules, so these have to be carved back out or importing them throws
// "Unexpected token 'export'".
const ESM_ONLY_PACKAGES = ['marked', 'turndown', '@noble'];

// next/jest builds its ignore patterns as `(?!(geist|...)/` style negative
// lookaheads and the package list inside them changes between Next releases,
// so match the lookahead itself rather than any one package name in it.
function allowEsmPackages(pattern: string): string {
  return pattern.replace(
    /\(\?!\(([^)]*)\)/g,
    (_match, list: string) => `(?!(${list}|${ESM_ONLY_PACKAGES.join('|')})`,
  );
}

const config: Config = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
};

async function jestConfig(): Promise<Config> {
  const nextConfig = (await createJestConfig(config)()) as Config;
  const ignorePatterns = (nextConfig.transformIgnorePatterns ?? []) as string[];
  const patched = ignorePatterns.map(allowEsmPackages);

  // A Next upgrade that reshapes those patterns would otherwise turn into four
  // suites failing with a syntax error from inside a dependency. Fail here instead.
  for (const pkg of ESM_ONLY_PACKAGES) {
    if (!patched.some((p) => p.includes(pkg))) {
      throw new Error(
        `jest.config.ts: could not exempt "${pkg}" from transformIgnorePatterns. ` +
          `next/jest changed its pattern shape; got: ${JSON.stringify(ignorePatterns)}`,
      );
    }
  }

  return { ...nextConfig, transformIgnorePatterns: patched };
}

export default jestConfig;
