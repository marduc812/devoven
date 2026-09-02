---
name: devoven-tool
description: Use when adding, editing, or reviewing a tool in this DevOven repo (devoven.com) — registering in menu.ts, registering an operation in the /blocks pipeline builder, picking a view primitive, wiring URL params, or building a tool whose input or output is an image, audio, video, PDF, or binary file rather than text.
---

# DevOven Tool

## Overview

Every tool computes in the browser. There is no backend. A tool is four things: a
`menu.ts` entry, a pure logic module, a thin page wrapper, and one view primitive.

**Core rule: a tool's input surface and its output surface are the same shape and
the same visual weight, each expressed in the medium of its own data.** Text in /
text out is the common case, not the required case.

## I/O symmetry

Pick the pair of surfaces from the data, not from habit:

| Tool shape | Input surface | Output surface |
|---|---|---|
| text → text | editable textarea | readonly textarea + `TextAreaAnalytics` |
| image → image | drop pane with preview | result pane with preview + download |
| image → text | drop pane with preview | readonly textarea + `TextAreaAnalytics` |
| text → image | editable textarea | result pane with preview + download |
| audio → audio | drop pane + `<audio>` + waveform | `<audio>` + download |
| audio/video → text | drop pane + player | readonly textarea |
| file(s) → file | drop list with per-file rows | result row + download |
| controls → anything | option controls only | the matching surface |

Both surfaces get the same padding, the same border treatment, the same
`min-height`, and the same label row. A user scanning the page sees two blocks of
equal weight with the operation between them — identical to `BasicConverter`,
regardless of medium.

**Never:** a bare unstyled `<input type="file">` on one side and a designed pane on
the other. **Never:** force a media operation into textareas because the text
primitives were easier to reach for.

Recipes, class strings, and the `MediaConverter` spec: read `media-io.md` in this
skill directory before building any non-text tool.

## Adding a tool

1. **Register in `menu.ts`** — the entry drives nav, search, and "similar tools".
   `type` groups related tools for suggestions; keep it consistent with siblings.
2. **Pure logic** in `Components/Functions/<Name>Tools/logic.ts`. No JSX, no DOM
   where avoidable — canvas/audio glue may live in `index.tsx`, but the
   transform itself must be importable and unit-testable.
3. **Tests** in `__tests__/` importing that logic module. `npm test`.
4. **Page** at `app/<category>/<slug>/page.tsx` — metadata plus the component.
5. **View primitive** — see the table above and `media-io.md`.
6. **URL params** — text tools read `?from=<value>` on mount. Media tools cannot
   seed a file from a URL, so they skip `?from=` but still honor their option
   params (`?quality=`, `?format=`, …) so a configured tool stays shareable.
7. **Share link** — mirror every param you read with `useShareLink`
   (`Components/Functions/ShareLink.tsx`), so the one "Copy link" button in the
   page header carries the whole tool state and not just the input:

   ```tsx
   useShareLink({ salt, variant, t: time, m: memory })
   ```

   `BasicConverter` and `AdvancedConverter` already publish their input textarea
   as `from`; a `Panel` tool has no textarea of its own, so it publishes `from`
   too. The rule is symmetry: the keys you publish are exactly the keys you read
   back on mount, so a copied link restores the page it was copied from. If an
   option is worth publishing, give it a reader as well.
8. **Blocks registry** — if the operation is `string → string`, also add it to
   `lib/blocks/operations/`, or it won't appear in the builder at `/blocks`. See
   the next section; this is a step on *edits* too, not just new tools.

## Blocks

`/blocks` is the pipeline builder: users chain operations so each block's output
feeds the next. It imports the tools' `logic.ts` modules directly, so a tool
only reaches it if someone registers it — and nothing enforces that but this
checklist.

**Ask on every tool you touch, not only new ones.** Editing a tool's logic is the
moment to check that its block still behaves, or that one is now possible.

An `Operation` is `(input: string, params) => string`. Synchronous, no DOM. Bad
input throws an `Error` with a message a user can act on; the pipeline catches it
and shows it on the block.

| Field | Meaning |
|---|---|
| `category` | `encoding` / `hashing` / `conversion` / `data` / `text` / `network` / `analysis` — picker grouping and accent color, from `Components/Blocks/categoryMeta.ts` |
| `params` | `select` (needs `options`, and `default` must be one of them) or free `text` |
| `chainable: false` | warns in the picker that the output is awkward to feed onward |
| `terminal: true` | the output is a final result, not a value — the pipeline *stops* here, downstream blocks are marked unreachable, and the picker tags it `END` |
| `output` | `'qr'` / `'barcode'` renders an image instead of text; `fn` returns the payload and `TerminalArtifact.tsx` draws it. Always terminal |

Which side of the line:

- **In, chainable** — anything a user would keep transforming: encoders, ciphers,
  hashes, format converters, text reshapers, address/number conversions.
- **In, terminal** — anything whose result is a report or a picture: entropy,
  readability, frequency tables, validators, decoders that explain a value, QR
  and barcode.
- **Out** — media and file tools; anything needing two inputs (diff, similarity);
  reference tables; interactive or stateful generators.

Register in the file under `lib/blocks/operations/` that matches the operation
(`ciphers.ts`, `hashing-extra.ts`, `data-extra.ts`, `text-extra.ts`,
`network.ts`, `analysis.ts`, …), or start a new file and add it to
`lib/blocks/registry.ts`. `__tests__/blocks-pipeline.test.ts` enforces the
registry invariants — unique ids, no terminal-and-chainable, every `select`
default present in its own options — so a sloppy entry fails the suite.

## View primitives

`Components/MainView/MainPanel/`, all take `backColor: MainViewColorVariants`:

- **`BasicConverter`** — two textareas, optional swap link.
- **`AdvancedConverter`** — the same plus `extraElements` controls.
- **`Panel`** — header + description + a fully custom body. What every media tool
  currently uses.
- **`ListView`** — list/reference display.
- **`MediaConverter`** — the symmetric media pair. See `media-io.md`; create it
  from that spec if it does not exist yet.

Descriptions support `[1 example text 2]` to render inline code examples.

## Category colors

`MainViewColorVariants` in `types.ts` is a closed union; `colorName` maps each to
its display label. Adding a category means touching all of:

- `types.ts` — `MenuColorVariantKeys`, `MainViewColorVariants`, `colorVariants`,
  `colorBadge`, `colorName`
- the `categoryAccent` map, which is **duplicated in six files**:
  `MainPanel/BasicConverter.tsx`, `MainPanel/AdvancedConverter.tsx`,
  `MainPanel/Panel.tsx`, `MainPanel/MediaConverter.tsx`, `Home/ListView.tsx`,
  and `View/Search.tsx`
- `app/globals.css` — the `.dark` overrides for `bg-<color>-50/100`,
  `border-<color>-100/200`, and `text-<color>-700`
- `menu.ts` — the group itself

Miss an accent map and that surface silently falls back to amber. Miss the CSS
and the category looks washed out in dark mode only. (`Components/Blocks/categoryMeta.ts`
is a different domain — Blocks *operation* categories — and does not need
updating when a site category is added.)

Current: yellow=Encoding, teal=Hashing, cyan=Converting, lime=Tools,
fuchsia=Image, rose=Text, sky=Network, violet=Audio, red=PDF.

Before claiming a Tailwind colour, check whether the site already uses those
shades for something else. `red-50/200/700` was the existing error-banner idiom,
so the PDF category's `.dark` rules also restyle every error banner — that was
an improvement (they had no dark rules at all), but confirm the blast radius
rather than discovering it later.

## Client-side weight budget

A media tool must not tax the other 700 pages. Anything over ~100 KB is
`await import()`-ed inside the handler, never imported at module top level, so it
downloads on first use of that one route.

| Need | Library | Weight | Load |
|---|---|---|---|
| Raster edit, filters, format convert | Canvas 2D | 0 | static |
| PDF write/edit | `pdf-lib` (installed) | ~350 KB | dynamic |
| PDF render/extract | `pdfjs-dist` (installed) | ~1 MB | dynamic |
| HEIC decode | `heic2any` (installed) | ~1.5 MB | dynamic |
| Audio decode/edit/encode WAV | Web Audio API | 0 | static |
| MP3 encode | `@breezystack/lamejs` | ~150 KB | dynamic |
| ZIP | `fflate` | ~30 KB | dynamic |
| Background removal | `@imgly/background-removal` | ~5 MB + model | dynamic, with progress UI |
| Video transcode | `@ffmpeg/ffmpeg` | ~25–30 MB | dynamic, with progress UI + explicit "this downloads N MB" notice |
| Speech to text | `@huggingface/transformers` Whisper | ~40 MB model | dynamic, with progress UI + notice |

Anything with a visible download cost states the cost in the UI before it starts,
and shows progress while it runs. Never a silent 30 MB fetch.

## Common mistakes

- Logic left inside the component, so `__tests__/` can't reach it.
- Registering in `menu.ts` but forgetting `lib/blocks/operations/` for a text op.
- Adding a block whose output is a report or a picture without `terminal: true`,
  so the builder lets users chain garbage onto the end of it.
- New category color added to `menu.ts` only — the type union and the three
  `categoryAccent` maps go stale together.
- `URL.createObjectURL` without a matching `revokeObjectURL`; media tools leak
  fast when a user drops twenty files.
- Heavy library imported at module scope, pulling it into the shared chunk.
- Media output offered as a preview with no download control.
- Reaching for a textarea because the input "could be" base64. If the user's data
  is a file, the surface is a drop pane.
