# Entropy CLI

A straightforward command-line interface (CLI) tool to showcase how to perform basic Entropy actions.

> This tool is in early development. As such, a lot of things do not work. Feel free to play around with it and report any issues at [github.com/entropyxyz/cli](https://github.com/entropyxyz/cli).

- [Install](#install)
- [Basic usage](#basic-usage)
- [Support](#support)
- [Contributions](#contributions)
- [License](#license)

## Install

1. Make sure you've got Yarn 1.22.X installed:

    ```
    # MacOS
    brew install yarn
    ```

    ```shell
    # Debian/Ubuntu
    sudo apt install yarn -y
    ```

    ```shell
    # Arch
    sudo pacman -S yarn
    ```

1. Clone the Entropy CLI repository and move into the new directory:

    ```shell
    git clone https://github.com/entropyxyz/cli && cd cli
    ```

1. Build the CLI with Yarn:

    ```shell
    yarn
    ```

1. Start the CLI:

    ```shell
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

## Basic usage

### Start the CLI

Start the CLI by moving to the CLI directory and running `yarn start`:

```shell
cd cli
yarn start
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

### Stop the CLI

You can stop the CLI by selecting **Exit** from the main menu or pressing `CTRL` + `c`.

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
