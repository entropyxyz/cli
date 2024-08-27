#! /usr/bin/env node

/* NOTE: calling this file entropy.ts helps commander parse process.argv */
import { Command, Option } from 'commander'
import launchTui from './tui'
import * as config from './config'
import { EntropyTuiOptions } from './types'

import { cliSign } from './flows/sign/cli'
import { getSelectedAccount, stringify, updateConfig } from './common/utils'
import { endpointOption, currentAccountAddressOption, passwordOption } from './common/utils-cli'
import Entropy from '@entropyxyz/sdk'
import { initializeEntropy } from './common/initializeEntropy'
import { entropyAccountCommand } from './account/command'
import { EntropyAccount } from './account/main'
import { BalanceCommand } from './balance/command'
import { TransferCommand } from './transfer/command'

const program = new Command()
// Array of restructured commands to make it easier to migrate them to the new "flow"
const RESTRUCTURED_COMMANDS = ['balance', 'new-account']

let entropy: Entropy

export async function loadEntropy (address: string, endpoint: string, password?: string): Promise<Entropy> {
  const storedConfig = config.getSync()
  const selectedAccount = getSelectedAccount(storedConfig.accounts, address)

  if (!selectedAccount) throw Error(`No account with address ${address}`)

  // check if data is encrypted + we have a password
  if (typeof selectedAccount.data === 'string' && !password) {
    throw Error('This account requires a password, add --password <password>')
  }

  entropy = await initializeEntropy({ keyMaterial: selectedAccount.data, endpoint, password })

  if (!entropy?.keyring?.accounts?.registration?.pair) {
    throw new Error("Signer keypair is undefined or not properly initialized.")
  }

  return entropy
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

entropyAccountCommand(entropy, program)

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
    const accountsCommand = new EntropyAccount(entropy, opts.endpoint)
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
  .action(async (_source, destination, amount, opts) => {
    const transferCommand = new TransferCommand(entropy, opts.endpoint)
    await transferCommand.sendTransfer(destination, amount)
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
