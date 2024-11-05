# src/ docs

- `src/cli.ts` - the entry-point for the application. Where all CLI and TUI
  (text user interface) functions are registered.
- `src/tui.ts` - the entry-point for the TUI.

## Special Folders

- `src/_template/` - a template and guide for "User Flow" folders
- `src/common/` - helper functions used accross the application
- `src/config/` - utils for entropy config
- `src/types/` - types used across the application

## "Domain" Folders

CLI functionality is grouped into "domains". Within these we pool common
resources needed for programmatic CLI and TUI usage (see `src/_template/` for
detail)

- `src/account/` - account creation, querying, manipulation etc.
- `src/balance/` - account balance querying
- `src/faucet/` - faucet functions for test-net
- `src/program/` - program deploying, querying, manipulation
- `src/sign/` - message signing
- `src/transfer/` - fund transfers

### Legacy Folders

- `src/flows` - a collection of functions leftover from an earier version

