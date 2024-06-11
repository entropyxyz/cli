# Entropy CLI

### Disclaimer: CLI currently in Alpha Stage, expect breaking changes

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

See help on programmatic usage:
```bash
entropy --help               # all commands
```



## Build and run

Follow these steps to build and install the CLI:

1. Ensure you have Yarn installed:

    ```bash
    yarn --version
    
    # Output example:
    # 1.22.22
    ```

1. Grab this repository and move into the new directory:

    ```bash
    git clone https://github.com/entropyxyz/cli
    cd cli
    ```

1. Build the project:

    ```plaintext
    yarn

    # yarn install v1.22.22
    # [1/4] Resolving packages...
    ```

1. Start the CLI:

    
    For an interactive text user interface:
    ```bash
    yarn start
    ```

    To read about programmatic use:
    ```bash
    yarn start --help
    ```

### Testing bin script

```bash
npm i -g
```
This will register the `entropy` bin script globally so that you can run

```bash
entropy --help
```

## Support

Need help with something? [Head over to the Entropy Community repository for support or to raise a ticket →](https://github.com/entropyxyz/community#support)
