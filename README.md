# DevOven

A collection of 574 developer tools that run in your browser. Encode, hash,
convert, format, generate, inspect. No accounts, no uploads, no database. Live
at [devoven.com](https://www.devoven.com), and it runs the same from a local
checkout.

572 of the 574 compute entirely client-side. The text you paste, the image you
drop and the PDF you split never leave the tab. Two tools cannot work that way,
and the section below says exactly what they send and where.

## Getting started

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. Node 22.x is what the project targets
(`engines` in `package.json`).

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server on port 3000 |
| `npm run build` | Production build; also the type check |
| `npm run start` | Serve the production build |
| `npm test` | Jest suite (370 files under `__tests__/`) |

There is no lint script. Next 16 removed `next lint`, and ESLint was dropped
with it. `npm run build` is the type check.

## Configuration

**Required: nothing.** `npm install && npm run dev` gives you the whole site,
every tool working, with no environment file at all. That is the point of a
codebase that computes in the browser.

**Optional**, for the two features that are not tools. Copy `.env.example` to
`.env.local` and fill in whichever you want:

| Variable | Enables | Unset means |
| --- | --- | --- |
| `TELEGRAM_BOT_TOKEN` | Feedback form delivery | The form answers "Feedback is not configured on this instance" |
| `TELEGRAM_CHAT_ID` | Feedback form delivery | Same; both are needed, either one alone does nothing |
| `NEXT_PUBLIC_GA_ID` | Google Analytics 4 | No analytics script is loaded and nothing is sent |

The Telegram pair is read server-side in `app/api/feedback/route.ts` and never
reaches the browser. `NEXT_PUBLIC_GA_ID` is public by design, since the ID ends
up in the page; use your own property if you fork this.

One more variable exists but you do not set it: `NEXT_PUBLIC_BUILD_VERSION` is
computed at build time in `next.config.js` from the commit SHA, and shows in the
footer. It falls back to `dev` outside a git checkout.

## Network access

Two tools genuinely cannot run in the tab, so they run on the server instead.
Both are in `app/api/`, which is all of the server-side code in the project.
You can read both routes end to end in about five minutes.

**My IP Address** (`/tools/my-ip` and `app/api/my-ip/route.ts`). A page cannot
see its own public IP, because the address the server sees is the thing being
asked about. The route reads three request headers, `x-forwarded-for` or
`x-real-ip`, `user-agent` and `accept-language`, and hands them straight back to
the caller that sent them. It stores nothing and writes nothing to a log.

**Google Maps API Scanner** (`/tools/gmaps-api-scanner` and
`app/api/gmaps-scan/route.ts`). This checks whether a Google Maps API key has
been left unrestricted, which means calling Google with it. Browsers cannot make
those calls directly, so the server does. The key you paste goes to Google's own
endpoints, 19 of them, and the results come back. The key is never stored, never
written to a log, and never sent anywhere except `googleapis.com`. It is still
your key leaving your machine, so only run it against a key you control, which
is the only key worth checking anyway.

There is also a feedback form. It is not a tool, and nothing reaches it unless
you type into it and press send. What you write, plus the page you were on and
your browser's user agent, is delivered to a Telegram chat the maintainer reads.
That delivery is the entire feature. Leave `TELEGRAM_BOT_TOKEN` and
`TELEGRAM_CHAT_ID` unset, which is the right state for a local checkout, and the
form says so instead of pretending to send.

What none of them do: no request bodies in logs, no IP addresses in logs, no
database, no session, no cookie, no analytics on tool input. There are three
`console.` calls in all of `app/api/`, and grepping for them is the fastest way
to check that claim rather than take it. All three are in the feedback route.
One says the Telegram credentials are unset. The other two report the HTTP
status Telegram gave back, or the message from an error `fetch` threw. None of
them print a message body, a key, an email or an IP.

Analytics, where it exists, is page views only and never touches what you typed.
Google Analytics loads only if you set `NEXT_PUBLIC_GA_ID`, so a fork sends
nothing. `@vercel/analytics` is in the layout unconditionally, but it is inert
off Vercel; delete `<Analytics />` from `app/layout.tsx` if you would rather it
were not there at all.

### Throttling

There is none in the application code. `/api/gmaps-scan` is expensive, one
request fans out to 19 calls to Google, so the hosted site throttles it at the
edge with Vercel WAF rate-limit rules, which run before the function is invoked
and are shared across instances. In-process counters could not do either.

A local checkout serving one person does not need throttling and does not get
any. If you self-host somewhere other people can reach, put a rate limit in
front of `/api/gmaps-scan` and `/api/feedback` at whatever sits in front of the
app: your CDN, your reverse proxy, your platform's WAF. Do not leave the
feedback endpoint reachable by strangers with your Telegram credentials behind
it and nothing in the way.

## The tools

They are grouped into nine categories, each with its own colour theme:

| Category | Route | Tools |
| --- | --- | --- |
| Encoding | `/encoding` | 52 |
| Hashing | `/hashing` | 31 |
| Converting | `/converting` | 143 |
| Tools | `/tools` | 214 |
| Text | `/text` | 52 |
| Network | `/network` | 26 |
| Image | `/image` | 16 |
| PDF | `/pdf` | 13 |
| Audio | `/audio` | 10 |

`menu.ts` is the single source of truth for that list: it drives navigation,
search, the "similar tools" suggestions and `app/sitemap.ts`. A tool that is not
in `menu.ts` is unreachable.

### Blocks

`/blocks` is a second front door to the same logic. Pick operations, chain them
into a pipeline, and each block's output feeds the next: Base64 decode into
JWT decode into JSON format, say. The registry lives in `lib/blocks/operations/`
and imports the tools' own logic modules, so an operation only shows up there
if someone registers it.

## Layout

```
app/                    One thin page per tool: metadata + the component
  api/                  The only server code (feedback, IP echo, key scanner)
Components/
  Functions/            Tool logic and UI, one directory or module per tool
  MainView/MainPanel/   Layout primitives every tool page is built from
lib/
  blocks/               Pipeline builder registry, operations and its worker
  regex/                Regex engine running off the main thread
__tests__/              Jest, against the logic modules rather than the JSX
menu.ts                 The catalogue
types.ts                Shared types, including the category colour map
```

## Adding a tool

1. Add an entry to the right group in `menu.ts`.
2. Put the logic in `Components/Functions/`: a `logic.ts` with pure functions,
   an `index.tsx` with the UI. Keeping the logic out of the JSX is what makes it
   testable and reusable.
3. Create `app/<category>/<tool-name>/page.tsx`: export `metadata`, render the
   component.
4. Build the UI from the primitives in `Components/MainView/MainPanel/`:
   `BasicConverter` (two textareas), `AdvancedConverter` (plus options),
   `MediaConverter` (image/audio/PDF/file), `Panel` (custom). Input and output
   should be the same shape and weight, in the medium of the data.
5. If the logic is `string -> string`, register it in `lib/blocks/operations/`
   too, so it reaches the pipeline builder.
6. Add tests in `__tests__/` against the logic module.

Tool pages read `?from=<value>` on mount to pre-populate their input, and some
accept extra params (`?encoding=utf-8`). Keep that working when you touch a
component.

[CONTRIBUTING.md](CONTRIBUTING.md) goes through the same six steps in more
detail, and lists what gets a pull request sent back.

Found a vulnerability? [SECURITY.md](SECURITY.md) says how to report it and what
is already known.

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS. Deployed on Vercel.

## License

Copyright (C) 2026 marduc812.

AGPL-3.0-or-later. See [LICENSE](LICENSE) for the full text.

In short: run it, study it, change it, share it. If you distribute a modified
version, or run one where other people can reach it over a network, they are
entitled to the source of your version under the same terms.

The DevOven name and logo are not covered by the license. Fork the code freely,
call the result something else.

Every npm dependency that ships in the bundle is credited at
[/open-source](https://www.devoven.com/open-source). The list lives in
`lib/third-party-licenses.ts`, and a test keeps it in step with `package.json`.
Two of them are LGPL (`gmp-wasm` and `web3-utils`); everything else is MIT, BSD,
ISC or Apache-2.0. Separately, `public/Templates/nmapreport.html` embeds jQuery
3.7.0, DataTables 1.13.8 and the Gabarito typeface, each under its own license
with the upstream notice left intact in the file.
