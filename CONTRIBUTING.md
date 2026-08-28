# Contributing

Thanks for looking. DevOven is a pile of small, self-contained tools, which
makes it an easy codebase to add one thing to without reading all of it.

## Setup

```bash
npm install
npm run dev
```

Node 22.x, per `engines` in `package.json`. Nothing else is required: no
database, no API keys, no accounts. The optional environment variables in
`.env.example` only affect analytics and the feedback form.

```bash
npm run build   # production build, and the type check
npm test        # Jest, 370 suites
```

There is no lint script. Next 16 removed `next lint`, and ESLint was dropped
with it, so `npm run build` is the type check. A PR that adds a linter back is
welcome as its own discussion, but not folded into another change.

## Adding a tool

A tool is four files and a menu entry. Look at any directory under
`Components/Functions/` for the shape.

1. **Register it in `menu.ts`.** Add an entry to the right category group.
   Nothing else discovers a tool: navigation, search, "similar tools" and
   `app/sitemap.ts` all read from here. A tool missing from `menu.ts` is
   unreachable even if the page exists.

2. **Write the logic in `Components/Functions/<Name>Tools/logic.ts`.** Pure
   functions, no React, no DOM. This is the part that gets tested and the part
   the pipeline builder can reuse, so keeping it out of the JSX matters more
   than it looks.

3. **Write the UI in `Components/Functions/<Name>Tools/index.tsx`.** Mark it
   `'use client'`. Build it from the primitives in
   `Components/MainView/MainPanel/`: `BasicConverter` for two textareas,
   `AdvancedConverter` when there are options, `MediaConverter` for image,
   audio, video, PDF or file work, `Panel` for anything custom. Each takes a
   `backColor` matching the category.

   Input and output get the same shape and the same visual weight, in the
   medium of the data. Two textareas for text to text, two media panes for
   image to image, a drop pane opposite a textarea for image to text. A bare
   `<input type="file">` facing a designed pane is the thing to avoid.

4. **Add the page at `app/<category>/<tool-name>/page.tsx`.** A thin wrapper:
   export `metadata`, render the component.

5. **Register it in the Blocks builder** if the logic is `string -> string`.
   Add it to the matching file in `lib/blocks/operations/`, or it will never
   appear in the pipeline at `/blocks`. This is worth checking when you edit an
   existing tool too, not only when you add one.

6. **Test the logic module** in `__tests__/`. Tests import from
   `Components/Functions/`, they do not render components.

Tool pages read `?from=<value>` on mount to pre-populate the input, and some
take extra parameters such as `?encoding=utf-8`. Keep that working.

In description strings, wrapping text as `[1 like this 2]` renders it as inline
code. `BasicConverter` and `AdvancedConverter` do the parsing.

## Things that will get a PR sent back

- **Logic living in the JSX.** It cannot be tested or reused from `/blocks`.
- **A tool that is not in `menu.ts`.** Nobody will ever find it.
- **Work that happens on the server.** Tools compute in the browser. Adding a
  fourth API route needs a reason that survives the question "why can this not
  run in the tab?", because every server round-trip is something a self-hosted
  copy has to think about. See "Network access" in the README.
- **Unbounded work on user input.** Several tools here have frozen a tab.
  Anything that scales badly belongs in a worker with a timeout;
  `Components/Functions/useTimeboxedWorker.ts` and `lib/regex/` show the
  pattern.
- **A new dependency without a line in `lib/third-party-licenses.ts`.** A test
  enforces this. It is how the `/open-source` page stays honest.

## Reference tools

Lookup tables, cheat sheets and static reference pages are not being added at
the moment. A batch of them was removed in favour of tools that actually
transform something. If you want to propose one, open an issue first.

## Commits and PRs

Small and focused beats large and thorough. One tool per PR.

Commit messages use a `type: lowercase summary` prefix (`feat:`, `fix:`,
`docs:`, `refactor:`) and say what changed in plain language. Look at
`git log` for the tone.

Confirm `npm run build` and `npm test` both pass before you open the PR. CI
runs both and will tell you anyway, but it is faster to find out locally.

## License

DevOven is AGPL-3.0-or-later. Contributions are accepted under the same terms.
The name and logo are not covered by the license, so a fork is welcome as long
as it is called something else.
