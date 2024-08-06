This is a test for the CLA Assistant. Please do not merge actually. :)

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

CLI interface for interacting with entropy.xyz. Running without commands starts an interactive ui

Options:
  -e, --endpoint <endpoint>                           Runs entropy with the given endpoint and ignores
                                                      network endpoints in config. Can also be given a
                                                      stored endpoint name from config eg: `entropy
                                                      --endpoint test-net`. (default:
                                                      "ws://testnet.entropy.xyz:9944/", env: ENDPOINT)

  -h, --help                                          display help for command

Commands:
  list|ls                                             List all accounts. Output is JSON of form [{ name,
                                                      address, data }]

  balance [options] <address>                         Get the balance of an Entropy account. Output is a

                                                      number
  transfer [options] <source> <destination> <amount>  Transfer funds between two Entropy accounts.
  sign [options] <address> <message>                  Sign a message using the Entropy network. Output is
                                                      a signature (string)
```

**Command-specific help**:

```shell
entropy balance --help
```

```output
Usage: entropy balance [options] <address>

Get the balance of an Entropy account. Output is a number

Arguments:
  address                    Account address whose balance you want to query

Options:
  -p, --password <password>  Password for the account
  -e, --endpoint <endpoint>  Runs entropy with the given endpoint and ignores network endpoints in
                             config. Can also be given a stored endpoint name from config eg: `entropy
                             --endpoint test-net`. (default: "ws://testnet.entropy.xyz:9944/", env:
                             ENDPOINT)
  -h, --help                 display help for command
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
   > Manage Accounts
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
   yarn run v1.22.22
   $ yarn build && npm install -g && entropy --help
   $ tsup
   CLI Building entry: src/cli.ts
   CLI Using tsconfig: tsconfig.json
   CLI tsup v6.7.0

   ...

   CLI interface for interacting with entropy.xyz. Running without commands starts an interactive ui


   Options:
     -e, --endpoint <endpoint>                           Runs entropy with the given endpoint and ignores
                                                         network endpoints in config. Can also be given a
                                                         stored endpoint name from config eg: `entropy
                                                         --endpoint test-net`. (default:
                                                         "ws://testnet.entropy.xyz:9944/", env: ENDPOINT)
     -h, --help                                          display help for command

   Commands:
     list|ls                                             List all accounts. Output is JSON of form [{ name,

                                                         address, data }]
     balance [options] <address>                         Get the balance of an Entropy account. Output is a
                                                         number
     transfer [options] <source> <destination> <amount>  Transfer funds between two Entropy accounts.
     sign [options] <address> <message>                  Sign a message using the Entropy network. Output is
                                                         a signature (string)

   Done in 3.07s.
   ```

## Support

Need help with something? [Head over to the Entropy Community repository for support or to raise a ticket →](https://github.com/entropyxyz/community#support)

## License

This project is licensed under [GNU Affero General Public License v3.0](./LICENSE).
