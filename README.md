# Entropy CLI

A straightforward command-line interface (CLI) tool to showcase how to perform basic Entropy actions.

> :warning: This tool is in early development. As such, a lot of things do not work. Feel free to play around with it and report any issues at [github.com/entropyxyz/cli](https://github.com/entropyxyz/cli).

- [Install](#install)
- [Usage](#usage)
    - [Text-based user interface](#text-based-user-interface)
    - [Programmatic mode](#programmatic-mode)
- [Available functions](#available-functions)
- [Development contributions](#development-contributions)
- [Support](#support)
- [License](#license)

## Install

```bash
npm install --global @entropyxyz/cli
```

## Usage

There are two ways to interact with this CLI:

- [Using the text-based user interface (TUI)](#text-based-user-interface).
- [Programmatically from the command line](#programmatic-use).

### Text-based user interface

You can use this tool interactively by calling the `entropy` executable without any arguments or options:

```bash
entropy
```

This command will bring you to the main menu:

```output
? Select Action (Use arrow keys)
> Manage Accounts
Balance
Register
Sign
Transfer
Deploy Program
User Programs
Exit
```

To exit this text-based user interface anytime, press `CTRL` + `c`.

### Programmatic mode

You can interact with the Entropy network using the CLI's programmatic mode. Simply call the `entropy` executable followed by the command you wish to use:

```bash
entropy balance 5GYvMHuB8J4mpJFCJ7scdR8AXGbT69B2bAqbNxPEa9ZSgEJm
```

For more information on the commands available, see the [CLI documentation](https://docs.entropy.xyz/reference/cli/).

#### Help

Use the `help` command to get information on what commands are available and what specific options or arguments they require:

**General help**:

```bash
entropy --help
```

```output
Usage: entropy [options] [command]

CLI interface for interacting with entropy.xyz. Running this binary without any commands or arguments starts a text-based
interface.

Options:
 -et, --tui-endpoint <url>                   Runs entropy with the given endpoint and ignores network endpoints in config.
                                             Can also be given a stored endpoint name from config eg: `entropy --endpoint
                                             test-net`. (default: "wss://testnet.entropy.xyz/", env: ENTROPY_TUI_ENDPOINT)
 -h, --help                                  display help for command

Commands:
 balance [options] <account <address|name>>  Command to retrieive the balance of an account on the Entropy Network
 account                                     Commands to work with accounts on the Entropy Network
 transfer [options] <destination> <amount>   Transfer funds between two Entropy accounts.
 sign [options] <msg>                        Sign a message using the Entropy network. Output is a JSON { verifyingKey,
                                             signature }
 program                                     Commands for working with programs deployed to the Entropy Network
```

**Command-specific help**:

```shell
entropy balance --help
```

```output
Usage: entropy balance [options] <account>

Command to retrieive the balance of an account on the Entropy Network

Arguments:
  account               The address an account address whose balance you want to query. Can also be the human-readable name of
                        one of your accounts

Options:
  -e, --endpoint <url>  Runs entropy with the given endpoint and ignores network endpoints in config. Can also be given a
                        stored endpoint name from config eg: `entropy --endpoint test-net`. (default:
                        "wss://testnet.entropy.xyz/", env: ENTROPY_ENDPOINT)
  -h, --help            display help for command
```

### Available functions

| Function        | Description                                                                          |
| --------------- | ------------------------------------------------------------------------------------ |
| Manage accounts | Create, import, and list your locally stored Entropy accounts.                       |
| Balance         | Show the balance of any locally stored accounts.                                     |
| Register        | Register a locally stored account with the Entropy network.                          |
| Sign            | Get a signature from the Entropy network using a locally stored, registered account. |
| Transfer        | Transfer funds from a locally stored account to any other address.                   |
| Deploy Program  | Deploy a program to the Entropy network using a locally stored account.              |
| User Programs   | List the programs stored on the Entropy network by any locally stored accounts.      |

For more CLI instructions, check out [docs.entropy.xyz/reference/cli](https://docs.entropy.xyz/reference/cli).

## Development contributions

All changes to this repo should be based off the `dev` branch. The `main` branch should not be directly edited, unless a hotfix is necessary. All PRs should follow this workflow:

```plaintext
feature_branch -> dev -> main
```

If you want to make changes to this CLI tool, you should install it by following these steps:

1. Ensure you have Node.js version 20.9.0 or above and Yarn version 1.22.22 installed:

   ```shell
   node --version && yarn --version
   ```

   ```output
   v22.2.0
   1.22.22
   ```

1. Clone the Entropy CLI repository and move into the new `cli` directory:

   ```shell
   git clone https://github.com/entropyxyz/cli
   cd cli
   ```

1. Use Yarn to install the dependencies and build the project.

   ```shell
   yarn
   ```

   This command pulls in the necessary packages and builds the CLI locally.

1. Run the CLI using `yarn`:

   ```shell
   yarn start
   ```

1. Start the CLI:

   For an interactive text user interface:

   ```bash
   yarn start
   ```

   You should now see the main menu:

   ```output
   ? Select Action (Use arrow keys)
   ❯ Manage Accounts
     Entropy Faucet
     Balance
     Register
     Sign
     Transfer
     Deploy Program
     User Programs
     Exit
   ```

   For programmatic use, see:

   ```bash
   yarn start --help
   ```

   ```output
   yarn run v1.22.1
   $ yarn build:global && entropy --help
   $ tsup && npm install -g
   CLI Building entry: src/cli.ts
   CLI Using tsconfig: tsconfig.json
   CLI tsup v6.7.0
   CLI Using tsup config: /home/mixmix/projects/ENTROPY/cli/tsup.config.ts
   CLI Target: es2022
   CLI Cleaning output folder
   ESM Build start
   ESM dist/cli.js 576.07 KB
   ESM ⚡️ Build success in 38ms
   DTS Build start
   DTS ⚡️ Build success in 985ms
   DTS dist/cli.d.ts 21.00 B

   up to date in 234ms
   Usage: entropy [options] [command]

   CLI interface for interacting with entropy.xyz. Running this binary without any commands or arguments starts a text-based
   interface.

   Options:
     -et, --tui-endpoint <url>                   Runs entropy with the given endpoint and ignores network endpoints in config.
                                                 Can also be given a stored endpoint name from config eg: `entropy --endpoint
                                                 test-net`. (default: "wss://testnet.entropy.xyz/", env: ENTROPY_TUI_ENDPOINT)
     -h, --help                                  display help for command

   Commands:
     balance [options] <account <address|name>>  Command to retrieive the balance of an account on the Entropy Network
     account                                     Commands to work with accounts on the Entropy Network
     transfer [options] <destination> <amount>   Transfer funds between two Entropy accounts.
     sign [options] <msg>                        Sign a message using the Entropy network. Output is a JSON { verifyingKey,
                                                 signature }
     program                                     Commands for working with programs deployed to the Entropy Network
   Done in 2.06s.
   ```

   You can see more detail on specific commands using `--help` e.g.

   ```bash

   ```

## Support

Need help with something? [Head over to the Entropy Community repository for support or to raise a ticket →](https://github.com/entropyxyz/community#support)

## License

This project is licensed under [GNU Affero General Public License v3.0](./LICENSE).
