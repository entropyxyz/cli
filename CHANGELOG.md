# Changelog

All notable changes to this project will be documented in this file.

The format extends [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
**At the moment this project DOES NOT adhere to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).**

**Until MAJOR version 1; All MINOR versions are breaking changes and all patch versions are bug fixes and features.**

Version header format: `[version] Name - year-month-day (entropy-core compatibility: version [range])`

## [UNRELEASED]

### Added
- new: 'src/flows/register/register.ts' - service file for register pure function
- new: './src/flows/manage-accounts/helpers/create-account.ts' - new helper file to house the pure function used to create a new entropy account
- update: './tests/manage-accounts.test.ts' - added test for create account pure function
- update: './src/common/utils.ts' - removed isValidSubstrateAddress and imported the method in from the sdk
- new: './tests/user-program-management.test.ts' - unit tests file for user program management flows
  - added test for adding a user program
  - added test for viewing a user program
- new: './src/flows/user-program-management/add.ts' - service file for adding user program pure function
- new: 'src/flows/user-program-management/helpers/questions.ts' - utility helper file for all the different inquirer questions used
- new: 'src/flows/user-program-management/types.ts' - user program management method types
- new: 'src/flows/user-program-management/view.ts' - service file for pure functions of viewing user programs
- new: 'src/flows/user-program-management/helpers/utils.ts' - utility helper file for user program management specific methods
### Fixed

### Changed
- folder name for user programs to match the kebab-case style for folder namespace
### Broke

### Meta/Dev

## [0.0.2] AntMan - 2024-07-12 (entropy-core compatibility: 0.2.0)

### Added
- new: './src/flows/balance/balance.ts' - service file separated out of main flow containing the pure functions to perform balance requests for one or multiple addresses
- new: './tests/balance.test.ts' - new unit tests file for balance pure functions
- new: './src/common/logger.ts' - utility file consisting of the logger used throughout the entropy cli
- new: './src/common/masking.ts' - utility helper file for EntropyLogger, used to mask private data in the payload (message) of the logging method
### Fixed
- keyring retrieval method was incorrectly returning the default keyring when no keyring was found, which is not the intended flow
### Changed
- conditional when initializing entropy object to only error if no seed AND admin account is not found in the account data, new unit test caught bug with using OR condition
### Broke

### Meta/Dev
- new: `./dev/README.md`
- `./.github`: their is now a check list you should fill out for creating a PR
