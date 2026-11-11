# Dependency security audit, November 11, 2026

The npm registry audit initially reported 18 affected packages: 3 high, 13 moderate and 2 low. These counts include packages affected through their dependencies, so they do not represent 18 independent vulnerabilities.

After the changes, the production audit reports zero known vulnerabilities. The full audit reports five low-severity affected packages, all in the same Jest configuration dependency chain through deepmerge. There are no remaining moderate, high or critical npm advisories.

## Changes

Updated compatible releases in the existing major version ranges, including Next.js 16.4.6, React and React DOM 19.3.1, the MCP SDK 1.32.2, fast-xml-parser 5.12.0, PDF.js 6.5.438 and Jest 30.5.2. Updated package minimums and the lockfile together. Kept Node.js 22.23.4, the latest available Node 22 patch at audit time.

Removed web3-utils, which pulls in web3-validator and a vulnerable Zod 3 release. Its five conversion functions now use local byte, UTF-8 and BigInt helpers. Thirty-seven compatibility vectors captured from web3-utils 4.3.3 cover Unicode, NUL handling, malformed input, signed numbers and integers beyond JavaScript's safe number range. Existing EIP-55 reference-vector tests remain; the random-address check now verifies checksum idempotence and address preservation.

Added targeted overrides for glob 14.0.4 and minimatch 11.0.8 in affected dependency ranges, and postcss-selector-parser 6.1.6 under the typography plugin. These overrides cross the version ranges requested by some development dependencies, so the full tests and production build are required compatibility checks.

The CI dependency audit now fails for moderate or higher advisories across production and development dependencies. Previously it checked only high-severity production advisories and allowed the job to fail without failing CI.

## Remaining advisory

[GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4) affects deepmerge 4.3.1. No patched release is available. Jest uses it to merge test configuration. It is a development dependency and is absent from the production dependency audit.

The older deepmerge 4.1.1 version falls outside the registry advisory's affected range, but a direct reproduction showed that merging a JSON object with a `__proto__` property produces an object that inherits the injected value. The downgrade was rejected and the current release was retained. A zero-advisory result obtained by that downgrade would have hidden a reproducible defect.

Remove the overrides when upstream packages require fixed versions themselves. Recheck deepmerge when a patched release or compatible Jest update becomes available.

## Scope

This audit covers dependencies recorded in package.json and package-lock.json using npm's current advisory database. It does not prove the absence of undisclosed vulnerabilities or audit the application's own source for security defects. Unrelated major migrations, such as Tailwind 4 and TypeScript 7, were deferred because the remaining npm advisories do not require them.

## Verification

All checks used Node.js 22.23.4 for application execution.

- `npm test -- --maxWorkers=2`: 421 suites and 8,865 tests passed.
- `npm run build`: passed compilation, TypeScript checking and generation of 632 static pages. An existing Tailwind safelist warning remains.
- `npm ls --all`: passed with no invalid dependency tree errors.
- Local production server: all 627 public prerendered routes returned HTTP 200.
- Browser checks: homepage navigation and all five replacement conversions passed, including a Unicode roundtrip and the integer 9007199254740993.
- PDF.js browser check: a generated one-page PDF rendered successfully in PDF to Images, with its page download controls available.
- No warnings or errors appeared in the browser console during the conversion and PDF checks.
- `npm audit --omit=dev`: zero known vulnerabilities.
- `npm audit --audit-level=moderate`: passes, with the five low-severity affected packages described above.

These checks establish that the tested local production build runs. They do not exercise every tool interaction or verify a remote deployment.
