# Entropy CLI

> :warning: This tool is in early development. As such, a lot of things do not work. Feel free to play around with it and report any issues at [github.com/entropyxyz/cli](https://github.com/entropyxyz/cli).

A straight-forward command-line interface (CLI) tool to showcase how to perform basic Entropy actions.

## Install

```bash
npm install -g @entropyxyz/cli
```

## Usage

### Interactive mode

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

### Programmatic mode

```bash
entropy balance 5GYvMHuB8J4mpJFCJ7scdR8AXGbT69B2bAqbNxPEa9ZSgEJm
```

See help on programmatic usage:
```bash
entropy --help               # all commands
entropy balance --help       # a specific command
```


### Available functions

| Function | Description |
| -------- | ----------- |
| Manage accounts | Create, import, and list your locally stored Entropy accounts. |
| Balance | Show the balance of any locally stored accounts. |
| Register | Register a locally stored account with the Entropy network. |
| Sign | Get a signature from the Entropy network using a locally stored, registered account. |
| Transfer | Transfer funds from a locally stored account to any other address. |
| Deploy Program | Deploy a program to the Entropy network using a locally stored account. |
| User Programs | List the programs stored on the Entropy network by any locally stored accounts. |

For more instructions on using the CLI, check out [docs.entropy.xyz/reference/cli](https://docs.entropy.xyz/reference/cli).

## Support

Need help with something? [Head over to the Entropy Community repository for support or to raise a ticket →](https://github.com/entropyxyz/community#support)

## License

This project is licensed under [GNU Affero General Public License v3.0](./LICENSE).


To read about programmatic use:
```bash
yarn start --help
```

## Development

<details>
  <summary>
    <strong>Development install</strong>
  </summary>

1. Install Node + yarn 1.22.x

  - we recommend installing Node with e.g. [NVM](https://github.com/nvm-sh/nvm)
  - enable yarn by running `corepack enable`

1. Grab this repository and move into the new directory:

  ```bash
  git clone https://github.com/entropyxyz/cli
  cd cli
  ```

1. Build the CLI with Yarn:

  ```bash
  yarn
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

</details>
<details>
  <summary>
    <strong>Global install</strong>
  </summary>

```bash
npm install -g
```
This will register the `entropy` bin script globally so that you can run

```bash
entropy --help
```

</details>
