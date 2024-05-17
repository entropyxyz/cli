# Entropy CLI

A straight-forward command-line interface (CLI) tool to showcase how to perform basic Entropy actions.

## Install

```bash
npm install -g @entropyxyz/cli
```

## Usage

Start an interactive interface:
```bash
entropy
```

Output current balances:
```bash
entropy balance
```

See help on programmatic usage:
```bash
entropy --help               # all commands
entropy balance --help       # a specific command
```


## Build and run

Follow these steps to build and install the CLI:

1. Ensure you have Yarn installed:

    ```shell
    yarn --version
    
    # Output example:
    # 1.22.22
    ```

1. Grab this repository and move into the new directory:

    ```shell
    git clone https://github.com/entropyxyz/cli
    cd cli
    ```

1. Build the project:

    ```plaintext
    yarn

    # yarn install v1.22.22
    # [1/4] Resolving packages...
    ```

1. Start the CLI with:

    ```shell
    yarn start
    ```

