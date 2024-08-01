#! /usr/bin/env node

/* NOTE: calling this file entropy.ts helps commander parse process.argv */
import { Command, Option } from 'commander'
import launchTui from './tui'
import * as config from './config'
import { EntropyTuiOptions } from './types'

import { cliListAccounts } from './flows/manage-accounts/cli'
import { cliEntropyTransfer } from './flows/entropyTransfer/cli'
import { cliSign } from './flows/sign/cli'
import { getSelectedAccount, stringify } from './common/utils'
import Entropy from '@entropyxyz/sdk'
import { initializeEntropy } from './common/initializeEntropy'
import { BalanceCommand } from './balance/command'

const program = new Command()

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
  const storedConfig = config.getSync()
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
      if (actionCommand.name() === 'balance' && actionCommand.args.length) {
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
  .description('List all accounts. Output is JSON of form [{ name, address, data }]')
  .action(async () => {
    // TODO: test if it's an encrypted account, if no password provided, throw because later on there's no protection from a prompt coming up
    const accounts = await cliListAccounts()
    writeOut(accounts)
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
