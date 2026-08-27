# Media I/O surfaces

Reference for DevOven tools whose input or output is not text. Read with
`SKILL.md`. The goal is that an image → image tool reads on the page exactly like
`BasicConverter` reads for text → text: two equal blocks, the operation between
them.

## Site palette (light-first)

Taken from `BasicConverter.tsx` / `Panel.tsx`. Do not invent new colors.

| Role | Classes |
|---|---|
| Micro label | `text-xs font-bold uppercase tracking-widest text-gray-500` |
| Input surface | `bg-white border border-gray-300` |
| Output surface | `bg-gray-50 border border-gray-300` |
| Focus / active | `border-gray-900` |
| Divider rule | `h-px bg-gray-300` |
| Primary action | `py-2 px-4 border border-gray-900 bg-gray-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors` |
| Error | `text-red-600 text-sm` |
| Mono body | `font-mono text-sm` |

Surfaces are square — the site uses no rounded corners on tool panes.

Dark mode is a `.dark` class override layer in `app/globals.css`, not a separate
palette. `bg-white`, `bg-gray-50`, `border-gray-300`, `border-gray-900`,
`text-gray-900`, and `text-gray-500` all have overrides there, so writing the
light classes above is enough — do not add `dark:` variants. If you need a token
that has no `.dark` rule yet, add the rule to `globals.css` rather than branching
in the component.

## The drop pane (input)

Same footprint as a 5-row textarea (`min-h-[9.5rem]`). Click-to-browse and
drag-and-drop both work; the `<input type="file">` is visually hidden, never
rendered raw.

```tsx
<label
  onDragOver={e => { e.preventDefault(); setDragging(true); }}
  onDragLeave={() => setDragging(false)}
  onDrop={e => { e.preventDefault(); setDragging(false); accept(e.dataTransfer.files); }}
  className={`flex flex-col items-center justify-center gap-2 w-full min-h-[9.5rem] p-4
    bg-white border border-dashed cursor-pointer transition-colors
    ${dragging ? 'border-gray-900 bg-gray-50' : 'border-gray-300 hover:border-gray-900'}`}
>
  <input type="file" accept="image/*" multiple={false} className="sr-only"
         onChange={e => accept(e.target.files)} />
  {preview
    ? <img src={preview} alt="" className="max-h-40 object-contain" />
    : <>
        <span className="text-xs font-bold uppercase tracking-wider text-gray-700">Drop a PNG or click to browse</span>
        <span className="text-xs text-gray-400">Processed in your browser — nothing is uploaded</span>
      </>}
</label>
```

Once a file is loaded the pane shows the preview plus a footer line with name,
dimensions, and size, and a `Replace` / `Clear` text button — it never collapses
back to a bare input.

The "nothing is uploaded" line belongs on every media tool. It is the site's
differentiator and users ask about it.

## The result pane (output)

Mirrors the drop pane's footprint, on `bg-gray-50`, with the download as the
primary action. Media tools have no `TextAreaAnalytics`, so the download button
plays that role.

```tsx
<div className="flex flex-col items-center justify-center gap-3 w-full min-h-[9.5rem] p-4 bg-gray-50 border border-gray-300">
  {result
    ? <>
        <img src={result.url} alt="Result" className="max-h-40 object-contain" />
        <a href={result.url} download={result.fileName}
           className="inline-block text-center py-2 px-4 border border-gray-900 bg-gray-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors">
          Download {result.fileName}
        </a>
      </>
    : <span className="text-xs uppercase tracking-widest text-gray-400">output</span>}
</div>
```

Per medium, swap the preview element only:

- **image** — `<img>`, `max-h-40 object-contain`, checkerboard behind anything
  with alpha.
- **audio** — `<audio controls className="w-full">` plus a canvas waveform when
  the tool is about time (trim, silence removal).
- **video** — `<video controls className="max-h-40">`.
- **pdf** — first page rendered to canvas via `pdfjs-dist`, plus a page count.
- **archive / multi-file** — a `font-mono text-sm` row list, one line per entry,
  with a "Download all" primary action. `MediaConverter` implements this: pass
  `results: MediaResult[]` (it takes precedence over `result`) plus
  `onDownloadAll`. Each row's `meta` becomes its save-link label. No zip
  dependency is installed, so "download all" saves the files in sequence with a
  ~150 ms gap, the way `PdfToImagesTools` already does it.

## Between the panes

Reuse `BasicConverter`'s divider so the rhythm matches:

```tsx
<div className="w-full flex flex-row justify-start items-center py-4 gap-3">
  <div className="w-12 h-px bg-gray-300" />
  <span className="text-gray-400 text-xs uppercase tracking-widest">output</span>
  <div className="flex-1 h-px bg-gray-300" />
</div>
```

Options (quality slider, format select, dimensions) sit above the divider, under
the input pane — they describe the transform of the thing you just dropped.

## Progress

Any operation that can exceed ~300 ms, or that downloads a library or model,
renders a determinate bar in the result pane and disables the action while
running:

```tsx
<div className="w-full h-1 bg-gray-200">
  <div className="h-1 bg-gray-900 transition-all" style={{ width: `${pct}%` }} />
</div>
<span className="text-xs text-gray-500">Downloading model — 12 MB of 41 MB</span>
```

State the megabytes before the download starts, not during.

## `MediaConverter` primitive

`Components/MainView/MainPanel/MediaConverter.tsx` implements everything above —
use it rather than re-deriving the panes. Its props live in `types.ts` as
`MediaConverterType`:

```ts
type MediaConverterType = {
  title: string;
  description: string;           // supports [1 example 2] highlighting
  backColor: MainViewColorVariants;
  accept: string;                // input accept attribute
  multiple?: boolean;
  inputMedium: 'image' | 'audio' | 'video' | 'pdf' | 'file';
  outputMedium: 'image' | 'audio' | 'video' | 'pdf' | 'file' | 'text';
  hint?: string;                 // overrides "Drop a file or click to browse"
  onFiles: (files: File[]) => void;
  source?: { url: string; name: string; meta?: string };
  result?: { url: string; fileName: string; meta?: string };
  textResult?: string;           // when outputMedium is 'text'
  progress?: { pct: number; label: string };
  error?: string;
  extraElements?: React.JSX.Element;  // options, rendered above the divider
};
```

It composes the same header, `ShareView`, and `AdditionalTools` blocks as `Panel`.
When `outputMedium` is `'text'`, the output half becomes `TextAreaAnalytics` + a
readonly textarea, identical to `BasicConverter`'s lower half — that is how an
image → text or audio → text tool stays symmetric.

`MediaConverter` does not own any object URLs; the tool does. Use the
`useAudioSource` / `useWavResult` hooks in
`Components/Functions/AudioTools/index.tsx` as the reference: each holds the
current URL in a ref, revokes the previous one before publishing a new one, and
revokes on unmount. Copy that shape for image and PDF tools rather than calling
`createObjectURL` inline.

Existing image tools in `Components/Functions/ImageTools/index.tsx` predate this
primitive and still hand-roll raw `file:` inputs. Migrate them opportunistically
when touching one — do not rewrite all fifteen in one pass.

## Client-side recipes

- **Canvas filters** (grayscale, blur, brightness, saturate, sepia, invert):
  `ctx.filter = 'grayscale(1) blur(3px)'` before `drawImage`. No library.
- **Watermark:** draw the image, then `ctx.globalAlpha` + `fillText` or a second
  `drawImage`. No library.
- **Audio edit:** `decodeAudioData` → `OfflineAudioContext` → `startRendering` →
  an `AudioBuffer`. Trim, gain, speed, channel merge, and concat are all buffer
  arithmetic. Encoding back to WAV is ~40 lines of `DataView` header writing —
  write it in `logic.ts` where it is testable, and only pull in an MP3 encoder if
  MP3 output is genuinely required.
- **PDF:** `pdf-lib` for structural edits (split, merge, rotate, page numbers,
  watermark, metadata), `pdfjs-dist` for rendering and text extraction. Both are
  already dependencies. Shared helpers live in `Components/Functions/PdfTools/
  logic.ts` (page-range parsing, page sizes, corner placement, the pdf-lib
  operations) — it is pure enough to run under Jest, so PDF behaviour is
  unit-tested against real documents rather than mocked.

  **`PDFDocument.load` defaults to `updateMetadata: true`**, which stamps
  pdf-lib as the Producer and rewrites ModDate — even in a tool that only
  *reads* metadata. Always load with `updateMetadata: false`.
  `PDFDocument.create()` also starts with empty metadata, so any tool that
  builds a derived document (split, extract) must copy the Info dictionary
  across or the output silently loses its title and author.

- **Background removal:** `@imgly/background-removal` is **AGPL-3.0** — serving
  it from devoven.com would oblige the whole site's source to be released under
  AGPL. Do not install it; IMG.LY sells a commercial licence for this reason.
  A compliant ML route is `@huggingface/transformers` (Apache-2.0) with a
  permissively-licensed ONNX model — BiRefNet is MIT but ~110 MB, while
  RMBG-1.4/2.0 and the MODNet weights are non-commercial. The site currently
  ships the zero-dependency alternative instead: colour-key removal in
  `Components/Functions/BackgroundRemoverTools/`, which flood-fills from the
  border so colours enclosed by the subject survive.
