# Security policy

## Reporting a vulnerability

Report privately through GitHub's [Report a vulnerability](https://github.com/marduc812/devoven/security/advisories/new)
form. It opens a draft advisory only you and the maintainers can read.

Please do not open a public issue for anything exploitable, and please do not
test against `devoven.com`. A local checkout reproduces everything the hosted
site does, so build the proof of concept there.

Include the tool or route, what an attacker gets out of it, and the smallest
input that triggers it. Expect a first reply within a week.

## What is in scope

DevOven is a static site plus three API routes. Almost all of the attack
surface a tool has is inside the reader's own tab, so the bar for a real
finding is "this hurts someone other than the person who pasted the input".

In scope:

- Stored or reflected XSS: input to one tool that executes script in the page,
  including through the `?from=` query parameter every tool reads on mount.
- Anything in `app/api/`. The three routes are the only server code:
  `/api/feedback`, `/api/my-ip`, `/api/gmaps-scan`.
- Server-side request forgery, or any way to make `/api/gmaps-scan` call a host
  that is not Google.
- Prototype pollution in a parser, which has bitten this codebase before.
- Dependency vulnerabilities that are actually reachable from shipped code.
  Please say which tool reaches the vulnerable call.

## What is not in scope

- A tool hanging or crashing the tab on input the user pasted themselves. Tool
  logic is untrusted-input-tolerant where it can be, but a regex tester that a
  user feeds a catastrophic pattern to is working as designed. Report it as a
  bug instead.
- Weak or broken algorithms offered on purpose. MD5, SHA-1, ROT13, Caesar and
  the rest of the classical ciphers are here because people need to work with
  them, not because they are recommended.
- Missing security headers on a page that has no session, no cookie and no
  account to protect.
- Output from `npm audit` with no path from a DevOven tool to the vulnerable
  code.
- The absence of rate limiting in the route handlers. There is none by design;
  see below.
- Findings against a fork or a self-hosted copy that has changed the routes.

## Known limits, already accepted

These are documented rather than fixed. Reporting them again will not earn a
response, but a way *around* them will.

- **The route handlers do no rate limiting.** This is deliberate. In-process
  counters are per instance, reset on cold start, and key off proxy headers the
  application cannot verify, so they give a number that is not the real ceiling
  and a client identity that is not trustworthy off-platform. `devoven.com`
  throttles `/api/gmaps-scan` and `/api/feedback` with Vercel WAF rules, which
  run at the edge before the function is invoked. A report that either endpoint
  can be called repeatedly from a local checkout is describing a local checkout.
- **A self-hosted instance is unthrottled until you throttle it.** If you expose
  a copy to other people, put a limit in front of it at your CDN, reverse proxy
  or WAF. This is written in the README as well.
- **`/api/gmaps-scan` sends the key you give it to Google.** That is what the
  tool is for. The key is never logged or stored, but it does leave the server.

## Handling of user data

No accounts, no sessions, no database. What tools compute stays in the tab.

Two routes handle anything that could identify a person:

- `/api/feedback` forwards what the sender typed, plus the referring page and
  user agent, to a Telegram chat the maintainer reads. That delivery is the
  whole point of the form. Nothing is written to a database.
- `/api/my-ip` reads request headers and returns them to the caller that sent
  them. It stores nothing.

`/api/gmaps-scan` receives a Google API key, tests it against Google, and
returns the result. It stores nothing and logs nothing containing the key.

Log lines from these routes carry no message body, key, email or IP. Platform
request logs are outside the application's control.
