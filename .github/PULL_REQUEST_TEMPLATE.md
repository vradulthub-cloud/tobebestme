## What changes for the person using it

<!-- One or two sentences, in the words the pane uses. -->

## Checks

- [ ] `claude plugin validate --strict .` passes
- [ ] `claude plugin test .` passes, with a test for any behavior that changed
- [ ] `node --test tests/scan.test.mjs` passes (if the search programs changed)
- [ ] `cd e2e && npm test` passes (if something is drawn differently; optional otherwise)
- [ ] A new file read or written, command run, message sent or network call has its row in SECURITY.md
- [ ] No secrets, tokens or private project names in code, tests or fixtures

CONTRIBUTING.md has the details. Security issues go through SECURITY.md, not here.
