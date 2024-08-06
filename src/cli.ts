#! /usr/bin/env node

/* NOTE: calling this file entropy.ts helps commander parse process.argv */
import { Command, Option } from 'commander'
import { randomAsHex } from '@polkadot/util-crypto'
import launchTui from './tui'
import * as config from './config'
import { EntropyTuiOptions } from './types'

import { cliEntropyTransfer } from './flows/entropyTransfer/cli'
import { cliSign } from './flows/sign/cli'
import { getSelectedAccount, stringify, updateConfig } from './common/utils'
import Entropy from '@entropyxyz/sdk'
import { initializeEntropy } from './common/initializeEntropy'
import { BalanceCommand } from './balance/command'
import { AccountsCommand } from './accounts/command'
import { ACCOUNTS_CONTENT } from './accounts/constants'

const program = new Command()
// Array of restructured commands to make it easier to migrate them to the new "flow"
const RESTRUCTURED_COMMANDS = ['balance', 'new-account']

function endpointOption (){
  return new Option(
    '-e, --endpoint <endpoint>',
    [
      'Runs entropy with the given endpoint and ignores network endpoints in config.',
      'Can also be given a stored endpoint name from config eg: `entropy --endpoint test-net`.'
    ].join(' ')
  )
    .env('ENDPOINT')
    .argParser(aliasOrEndpoint => {
      /* see if it's a raw endpoint */
      if (aliasOrEndpoint.match(/^wss?:\/\//)) return aliasOrEndpoint

      /* look up endpoint-alias */
      const storedConfig = config.getSync()
      const endpoint = storedConfig.endpoints[aliasOrEndpoint]
      if (!endpoint) throw Error('unknown endpoint alias: ' + aliasOrEndpoint)

      return endpoint
    })
    .default('ws://testnet.entropy.xyz:9944/')
    // NOTE: argParser is only run IF an option is provided, so this cannot be 'test-net'
}

function passwordOption (description?: string) {
  return new Option(
    '-p, --password <password>',
    description || 'Password for the account'
  )
}

function currentAccountAddressOption () {
  const storedConfig = config.getSync()
  return new Option(
    '-a, --account <accountAddress>',
    'Sets the current account for the session or defaults to the account stored in the config'
  )
    .env('ACCOUNT_ADDRESS')
    .argParser(async (address) => {
      if (address === storedConfig.selectedAccount) return address
      // Updated selected account in config with new address from this option
      const newConfigUpdates = { selectedAccount: address }
      await config.set({ ...storedConfig, ...newConfigUpdates })

      return address
    })
    .hideHelp()
    .default(storedConfig.selectedAccount)
}

let entropy: Entropy

async function loadEntropy (address: string, endpoint: string, password: string) {
  const storedConfig = await config.get()
  const selectedAccount = getSelectedAccount(storedConfig.accounts, address)

  if (!selectedAccount) throw Error(`No account with address ${address}`)

  // check if data is encrypted + we have a password
  if (typeof selectedAccount.data === 'string' && !password) {
    throw Error('This account requires a password, add --password <password>')
  }

  entropy = await initializeEntropy({ keyMaterial: selectedAccount.data, endpoint, password })
}

/* no command */
program
  .name('entropy')
  .description('CLI interface for interacting with entropy.xyz. Running without commands starts an interactive ui')
  .addOption(endpointOption())
  .addOption(currentAccountAddressOption())
  .addOption(
    new Option(
      '-d, --dev',
      'Runs entropy in a developer mode uses the dev endpoint as the main endpoint and allows for faucet option to be available in the main menu'
    )
      .env('DEV_MODE')
      .hideHelp()
  )
  .hook('preAction', async (_thisCommand, actionCommand) => {
    if (!entropy || (entropy.keyring.accounts.registration.address !== actionCommand.args[0] || entropy.keyring.accounts.registration.address !== actionCommand.opts().account)) {
      // balance includes an address argument, use that address to instantiate entropy
      // can keep the conditional to check for length of args, and use the first index since it is our pattern to have the address as the first argument
      if (RESTRUCTURED_COMMANDS.includes(actionCommand.name()) && actionCommand.args.length) {
        await loadEntropy(actionCommand.args[0], actionCommand.opts().endpoint, actionCommand.opts().password)
      } else {
        // if address is not an argument, use the address from the option
        await loadEntropy(actionCommand.opts().account, actionCommand.opts().endpoint, actionCommand.opts().password)
      }
    }
  })
  .action((options: EntropyTuiOptions) => {
    launchTui(entropy, options)
  })

/* list */
program.command('list')
  .alias('ls')
  .description('List all accounts. Output is JSON of form [{ name, address, verifyingKeys }]')
  .addOption(endpointOption())
  .action(async (options) => {
    // TODO: test if it's an encrypted account, if no password provided, throw because later on there's no protection from a prompt coming up
    const storedConfig = await config.get()
    const accountsCommand = new AccountsCommand(entropy, options.endpoint)
    const accounts = accountsCommand.listAccounts(storedConfig.accounts)
    writeOut(accounts)
    process.exit(0)
  })

/* new account */
program.command('new-account')
  .alias('new')
  .description('Create new entropy account from imported seed or from scratch. Output is JSON of form [{name, address}]')
  .addOption(endpointOption())
  .addOption(passwordOption())
  .addOption(
    new Option(
      '-s, --seed',
      'Seed used to create entropy account'
    ).default(randomAsHex(32))
  )
  .addOption(
    new Option(
      '-n, --name',
      'Name of entropy account'
    ).makeOptionMandatory(true)
  )
  .addOption(
    new Option(
      '-pa, --path',
      'Derivation path'
    ).default(ACCOUNTS_CONTENT.path.default)
  )
  .action(async (opts) => {
    const storedConfig = await config.get()
    const { seed, name, path, endpoint } = opts
    const accountsCommand = new AccountsCommand(entropy, endpoint)

    const newAccount = await accountsCommand.newAccount({ seed, name, path })
    await accountsCommand.updateConfig(storedConfig, newAccount)
    writeOut({ name: newAccount.name, address: newAccount.address })
    process.exit(0)
  })

/* register */
program.command('register')
  .description('Register an entropy account with a program')
  .argument('address', 'Address of existing entropy account')
  .addOption(passwordOption())
  .addOption(endpointOption())
  .addOption(
    new Option(
      '-pointer, --pointer',
      'Program pointer of program to be used for registering'
    )
  )
  .addOption(
    new Option(
      '-data, --program-data',
      'Path to file containing program data in JSON format'
    )
  )
  .action(async (address, opts) => {
    const storedConfig = await config.get()
    const { accounts } = storedConfig
    const accountsCommand = new AccountsCommand(entropy, opts.endpoint)
    writeOut('Attempting to register account with addtess: ' + address)
    const accountToRegister = getSelectedAccount(accounts, address)
    if (!accountToRegister) {
      throw new Error('AccountError: Unable to register non-existent account')
    }
    const updatedAccount = await accountsCommand.registerAccount(accountToRegister)
    const arrIdx = accounts.indexOf(accountToRegister)
    accounts.splice(arrIdx, 1, updatedAccount)
    await updateConfig(storedConfig, { accounts, selectedAccount: updatedAccount.address })
    writeOut("Your address" + updatedAccount.address + "has been successfully registered.")
    process.exit(0)
  })

/* balance */
program.command('balance')
  .description('Get the balance of an Entropy account. Output is a number')
  .argument('address', 'Account address whose balance you want to query')
  .addOption(passwordOption())
  .addOption(endpointOption())
  .action(async (address, opts) => {
    const balanceCommand = new BalanceCommand(entropy, opts.endpoint)
    const balance = await balanceCommand.getBalance(address)
    writeOut(balance)
    process.exit(0)
  })

/* Transfer */
program.command('transfer')
  .description('Transfer funds between two Entropy accounts.') // TODO: name the output
  .argument('source', 'Account address funds will be drawn from')
  .argument('destination', 'Account address funds will be sent to')
  .argument('amount', 'Amount of funds to be moved')
  .addOption(passwordOption('Password for the source account (if required)'))
  .addOption(endpointOption())
  .addOption(currentAccountAddressOption())
  .action(async (source, destination, amount, opts) => {
    await cliEntropyTransfer({ source, destination, amount, ...opts })
    // writeOut(??) // TODO: write the output
    process.exit(0)
  })

/* Sign */
program.command('sign')
  .description('Sign a message using the Entropy network. Output is a signature (string)')
  .argument('address', 'Account address to use to sign')
  .argument('message', 'Message you would like to sign')
  .addOption(passwordOption('Password for the source account (if required)'))
  .addOption(endpointOption())
  .addOption(currentAccountAddressOption())
  .action(async (address, message, opts) => {
    const signature = await cliSign({ address, message, ...opts })
    writeOut(signature)
    process.exit(0)
  })

function writeOut (result) {
  const prettyResult = stringify(result)
  process.stdout.write(prettyResult)
}

program.parseAsync().then(() => {})
