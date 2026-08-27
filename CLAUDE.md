# CLAUDE.md

Guidance for coding agents working in this repository.

## Commands

```bash
npm run dev      # Start development server at http://localhost:3000
npm run build    # Build for production, and the type check
npm run start    # Start production server
npm run test     # Run the Jest suite in __tests__/
```

There is no lint script. Next 16 removed `next lint`, and ESLint went with it,
so `npm run build` is the type check and `npm test` is the suite. Adding a
linter back is a deliberate decision, not a side errand.

Node 22.x is required (specified in `package.json` `engines`).

Tests live in `__tests__/` and run with Jest. They import pure logic from
`Components/Functions/` (mostly `Utils.ts` and the per-tool logic modules)
rather than rendering components, so keep tool logic out of the JSX where it
needs coverage.

## Architecture Overview

**DevOven** is a Next.js 16 (App Router) collection of browser-side developer tools deployed at https://www.devoven.com. All tool computation happens client-side in the browser - there is no backend API beyond Next.js's built-in routing.

### Tool Categories & Color Themes

Tools are grouped into categories, each with a distinct Tailwind color theme
(`MainViewColorVariants` in `types.ts`):
- `encoding` → yellow
- `hashing` → teal
- `converting` → cyan
- `tools` → lime
- `image` → fuchsia
- `text` → rose
- `network` → sky
- `audio` → violet
- `pdf` → red

### Data Flow for Adding a New Tool

**Use the `devoven-tool` skill** (`.claude/skills/devoven-tool/`) when adding or
reviewing a tool. It covers the steps below plus the input/output symmetry rule
and the media (image / audio / video / PDF / file) surfaces.

1. **Register in `menu.ts`** - add an entry to the appropriate category group. This drives navigation, search, and the "similar tools" suggestions.

2. **Implement logic in `Components/Functions/`** - tool logic lives in:
   - `Encoders.tsx` - all encoding tools as named exports
   - `Hashers/` - one file per hash algorithm
   - `Converters.tsx` - color/ETH conversion tools
   - `Tools.tsx` - standalone tools (password generator, etc.)
   - Complex tools (e.g. NmapViewer) get their own subdirectory

3. **Create the page** at `app/[category]/[tool-name]/page.tsx` - each page is a thin wrapper that sets Next.js metadata and renders the function component from step 2.

4. **Register in the Blocks builder** - if the logic runs on a string and returns
   a string, add it to `lib/blocks/operations/` too, or it will never appear in
   the pipeline builder at `/blocks`. Ask this on every tool, not just new ones:
   editing a tool's logic is the moment to check whether its block is still
   correct, or whether one is now possible. See "Blocks Builder" below.

### Blocks Builder (`/blocks`)

`lib/blocks/` is a second front door to the same logic: users chain operations
into a pipeline where each block's output feeds the next. It imports the tools'
`logic.ts` modules directly, so a tool only reaches it if someone registers it.

- **Registry**: `lib/blocks/registry.ts` concatenates the files in
  `lib/blocks/operations/` (`encoding.ts`, `encoding-new.ts`, `encoding-extra.ts`,
  `ciphers.ts`, `hashing.ts`, `hashing-extra.ts`, `conversion.ts`,
  `data-format.ts`, `data-extra.ts`, `text-utils.ts`, `text-extra.ts`,
  `network.ts`, `analysis.ts`). Add to the file that matches the operation, or
  start a new one and wire it into the registry.
- **Shape**: an `Operation` is `(input: string, params) => string`. It throws an
  `Error` with a human-readable message on bad input; the pipeline catches it and
  shows it on the block. No async, no DOM.
- **`chainable`**: `false` warns in the picker that the output is awkward to feed
  onward (e.g. a color string).
- **`terminal: true`**: the output is a final result, not a value - a rendered
  artifact or a human-readable report. The pipeline *stops* at a terminal block:
  everything after it is marked unreachable, and the picker tags it `END`. Set
  `terminal` on anything whose output nobody would sensibly transform further.
- **`output`**: `'qr'` or `'barcode'` makes the block render an image instead of
  text (see `Components/Blocks/TerminalArtifact.tsx`). Rendered outputs are
  always terminal; `fn` returns the payload and the component draws it.
- **Not everything belongs**: media, file, and multi-input tools (diff, anything
  needing two texts) stay out. Reference tables and interactive generators stay
  out. Anything whose result is a report can go in as `terminal`.
- Tests live in `__tests__/blocks-pipeline.test.ts`, which enforces the registry
  invariants (unique ids, no terminal-and-chainable, select defaults valid).

### View Components (`Components/MainView/MainPanel/`)

Layout primitives for tool UIs, all accepting a `backColor: MainViewColorVariants` prop:
- **`BasicConverter`** - two-textarea (input/output) layout with optional swap button
- **`AdvancedConverter`** - like BasicConverter but accepts `extraElements` (checkboxes, selects, etc.)
- **`Panel`** - fully custom content area (no textareas)
- **`ListView`** - list-based display
- **`MediaConverter`** - symmetric drop-pane / result-pane layout for tools whose
  input or output is an image, audio, video, PDF, or file (set `outputMedium:
  'text'` for media→text tools)

A tool's input and output surfaces must be the same shape and visual weight, in
the medium of the data - two textareas for text→text, two media panes for
image→image, a drop pane and a textarea for image→text. Never a bare
`<input type="file">` opposite a designed pane. See the `devoven-tool` skill.

### Key Conventions

- **URL pre-population**: Tool components read `?from=<value>` from the query string on mount to pre-populate inputs. Tools with extra options also support additional params (e.g. `?encoding=utf-8`, `?zeros=true`).

- **Description highlighting**: In description strings, wrap example text with `[1 example text 2]` - the `BasicConverter` and `AdvancedConverter` components parse this to render examples as styled inline code.

- **All tool components are `'use client'`** - they use `useState`/`useEffect` for reactive conversion.

- **Shared utilities** in `Components/Functions/Utils.ts`: binary/text converters, hex/RGB helpers, luminance calculations, and `getSuggestions()` (finds related tools by type from `menu.ts`).

- **Types** are centralized in `types.ts`, including the `MainViewColorVariants` union and `colorVariants` record that maps color names to Tailwind classes.

- **`@/` path alias** maps to the project root.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
