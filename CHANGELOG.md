# Changelog

All notable changes to this project will be documented in this file.

The format extends [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
**At the moment this project DOES NOT adhere to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).**

**Until MAJOR version 1; All MINOR versions are breaking changes and all patch versions are bug fixes and features.**

Version header format: `[version] Name - year-month-day (entropy-core compatibility: version [range])`

## [0.m.p] Echo - YYYY-MM-DD (entropy-core compatibility: 0.3.0)

### Fixed

- Shared
  - amount units are now correct! [#306](https://github.com/entropyxyz/cli/pull/306)
    - 1 lilBITS = 0.00000000001 BITS
    - 1 BITS = 10000000000 lilBITS
- Programmatic CLI
  - `entropy program list` now prints output! [#298](https://github.com/entropyxyz/cli/pull/298)

### Added

- Shared
  - new methods for conversion and other math operations [#306](https://github.com/entropyxyz/cli/pull/306)
    - BITS => lilBITS
    - lilBITS => BITS
    - rounding to a specific number of decimal places
    - lilBITS per bits calculation
  - new method to pull entropy token details from chain, and cache the results [#306](https://github.com/entropyxyz/cli/pull/306)
  
- TUI
  - animation on tui load (while entropy loads) [#288](https://github.com/entropyxyz/cli/pull/288)

### Changed

- Shared
  - updated return data displayed to user on account creation (create or import) [#311](https://github.com/entropyxyz/cli/pull/311)
  - Balance now displays the number of BITS to the nearest 4 decimal places [#306](https://github.com/entropyxyz/cli/pull/306)

- TUI
  - updated regsitration and transfer flow to use progress loader to provide a signal to the user something is happening [#324](https://github.com/entropyxyz/cli/pull/324)
  - removed use of progress bar throughout TUI [#324](https://github.com/entropyxyz/cli/pull/324)
  - updated display amount for Faucet process [#323](https://github.com/entropyxyz/cli/pull/323)

## [0.1.1] Deadpool - 2024-11-06 (entropy-core compatibility: 0.3.0)

### Fixed

- TUI had a bug where it errored for fresh configs on statup


## [0.1.0] Carnage - 2024-11-06 (entropy-core compatibility: 0.3.0)

### Added

- programmatic CLI commands
  - changed: `entropy` now list help for commands you could launch
  - new: `entropy account create`
  - new: `entropy account import`
  - new: `entropy account list`
  - new: `entropy account register`
  - new: `entropy program deploy`
  - new: `entropy -v` or `entropy --version` displays CLI version
  - new: `entropy -cv` or `entropy --core-version` displays entropy core version

- TUI
  - added: `entropy tui` - this is now the default way to launch the TUI
  - new: added faucet to main menu for TUI
  - updated faucet to use loading spinner to indicate to user the progress of the transfer
  - new: menu item to trigger a jumpstart to the network (needs to be run once for fresh test networks)
  - new: added colours to the logs for easier reading

- documentation
  - updated: `./README.md`
  - new: `./src/README.md` - an guide to the source of the project
  - new: `./src/_template/*` - an example "domain" with lots of notes

- tests
  - new: `./tests/account.test.ts` - tests for `./src/account/`
  - updated: `./tests/balance.test.ts` - tests for `./src/balance/`
  - new: `./tests/common.test.ts` - tests for `./src/common/`
  - updated: `./tests/config.test.ts` - tests for `./src/config/`
  - new: `./tests/e2e.cli.sh` - a shell script which is an early test for programmatic usage

  - new: `./tests/faucet.test.ts` - tests `./src/faucet/`
  - new: `./tests/global.test.ts` - 
  - new: `./tests/program.test.ts` - tests for `./src/program/`

- programs
  - new: `./tests/programs/faucet_program.wasm` - the faucet program!

- packages
  - new: `yocto-spinner` for adding loading spinners to the cli
  - some minor package updates

- github actions
  - new: CLA action

### Changed

- updated SDK version to v0.3.0 (entropy-core 0.3.0)
  - updated us to use `four-nodes` docker setup
- logger to handle nested contexts for better organization of logs
- update: `./src/common/utils.ts` - removed isValidSubstrateAddress and imported the method in from the sdk
- file restructure:
  - removed: `src/flows/*`
  - added
    - `./src/common/entropy-base.ts` - base abstract class for all our domains `main.js` files
    - `./src/_template` - docs explaining the new file structure pattern
    - `./src/account` - new file structure for our CLI/TUI flows
      - NOTE: this contains register flow
    - `./src/balance` - new file structure for our CLI/TUI flows
    - `./src/faucet` - new file structure for our CLI/TUI flows
    - `./src/program` - new file structure for our CLI/TUI flows
      - NOTE: this merges user-program + dev-program domains into a single domain
    - `./src/sign` - new file structure for our CLI/TUI flows
    - `./src/transfer` - new file structure for our CLI/TUI flows
- folder name for user programs to match the kebab-case style for folder namespace
- ascii art print out now shows up to date core version based, coming from SDK
- updated how errors are handled with the register, the process will no longer exit and allow user's to continue using the CLI

### Broke

- config migration : remove all `verifyingKeys` from accounts
    - network reset means that while all account keys are preserved, all state such as verifyingKeys is lost
    - we want users to maintain the accounts they have set up, but reset the state that will no longer work

- network now uses `four-nodes` docker setup
  - requires an update to `/etc/hosts` for local testing, should include line:
    ```
    127.0.0.1 alice-tss-server bob-tss-server charlie-tss-server dave-tss-server
    ```
- for programmatic CLI
  - change account listing:
    - old: `entropy list`
    - new: `entropy account list [options]`
  - changed transfer:
    - old: `entropy transfer [options] <source> <destination> <amount>`
    - new: `entropy transfer [options] <destination> <amount>`
  - changed env: `ENDPOINT` => `ENTROPY_ENDPOINT`

- for TUI
  - `entropy` now displays help, must now use `entropy tui` to launch TUI
  - "endpoint" configuration has changed
    - see `entropy --help`
      - change flag: `--endpoint` => `--tui-endpiont`
      - change env: `ENTROPY_ENDPOINT` => `ENTROPY_TUI_ENDPOINT`
    - This is because of [collisions we were seeing](https://github.com/entropyxyz/cli/issues/265) with `commander` flags.
    - Does not effect programmatic CLI usage
    - We may revert this in a future release.
  - deploying programs now requires
    - `*.wasm` file for `bytecode`
    - `*.json` file path for `configurationSchema`
    - `*.json` file path for `auxillaryDataSchema`

## [0.0.3] Blade - 2024-07-17 (entropy-core compatibility: 0.2.0)

### Fixed

- HOT-FIX programmatic balance error [183](https://github.com/entropyxyz/cli/pull/183)

## [0.0.2] AntMan - 2024-07-12 (entropy-core compatibility: 0.2.0)

### Added

- new: `./src/flows/balance/balance.ts` - service file separated out of main flow containing the pure functions to perform balance requests for one or multiple addresses
- new: `./tests/balance.test.ts` - new unit tests file for balance pure functions
- new: `./src/common/logger.ts` - utility file consisting of the logger used throughout the entropy cli
- new: `./src/common/masking.ts` - utility helper file for EntropyLogger, used to mask private data in the payload (message) of the logging method

### Fixed

- keyring retrieval method was incorrectly returning the default keyring when no keyring was found, which is not the intended flow

### Changed

- conditional when initializing entropy object to only error if no seed AND admin account is not found in the account data, new unit test caught bug with using OR condition

### Broke

### Meta/Dev

- new: `./dev/README.md`
- `./.github`: their is now a check list you should fill out for creating a PR
