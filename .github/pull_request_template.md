## What this changes

<!-- One or two sentences. If it fixes an issue, write "Fixes #123". -->

## Checks

- [ ] `npm test` passes
- [ ] `npm run build` passes

<!-- Delete this section if the PR does not add or change a tool. -->

## For a tool change

- [ ] Registered in `menu.ts`
- [ ] Logic is in `logic.ts`, separate from the JSX, and has tests in `__tests__/`
- [ ] Input and output surfaces are the same shape and weight
- [ ] `?from=` pre-population still works
- [ ] Registered in `lib/blocks/operations/`, or it is not `string -> string`
- [ ] New dependency added to `lib/third-party-licenses.ts`, or no new dependency
