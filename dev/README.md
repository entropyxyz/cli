# Hello sdk dev!

## Tests

For the tests to run you **must** edit your `/etc/hosts` file, adding:

```
127.0.0.1   alice-tss-server
127.0.0.1   bob-tss-server
127.0.0.1   dave-tss-server
127.0.0.1   charlie-tss-server
```

## Linting

We've got automated linting set up as a pre-commit hook.
Setup

- dependencies: `husky`, `pinst`, `lint-staged`
- files: `.husky/`

If you are blocked from committing, you can skip these hooks

```bash
git commit --no-verify
```

### A note on PR's

- Please check all relevant boxes in pr template
- Please select an appropriate reviewer.
   - PR's that have the reviewer also contribute code will either not be merged in or they might get reverted.
- PR for `dev` -> `main`
   - must have:
      - [ ] two QA approvals one from `js team` one from `dev rel`
      - [ ] comprehensive coverage of change log

## Publishing all included


Always publish from `main` branch

```bash
git checkout main
yarn burn
yarn
yarn bundle
yarn version --patch # patch|minor|major
# npm publish # we are not live yet on npm do this when we have global install figured out
git push origin main --tags
```

go create a release on github if possible.


## Deploying new faucet
<!-- TO-DO: Cleanup requirements -->
#### Requirements
- faucet program
  - build from repo or use binary in tests/programs/faucet_program.wasm
- configuration and aux data schema
- program mod account with funds to deploy
- child funded accounts to be used as issuers of funds for faucet
  - child accounts must be registered with deployed faucet program
