#! /usr/bin/env node

/* NOTE: calling this file entropy.ts helps commander parse process.argv */
import { Command, Option } from 'commander'
import launchTui from './tui'
import * as config from './config'
import { EntropyTuiOptions } from './types'

import { cliSign } from './flows/sign/cli'
import { getSelectedAccount, stringify, updateConfig } from './common/utils'
import { endpointOption, currentAccountAddressOption, loadEntropy, passwordOption } from './common/utils-cli'
import Entropy from '@entropyxyz/sdk'
import { entropyAccountCommand } from './account/command'
import { EntropyAccount } from './account/main'
import { BalanceCommand } from './balance/command'
import { TransferCommand } from './transfer/command'

let entropy: Entropy
async function setEntropyGlobal (address: string, endpoint: string, password?: string) {
  if (entropy) {
    const currentAddress = entropy?.keyring?.accounts?.registration?.address
    if (address !== currentAddress) {
      // Is it possible to hit this?
      // - programmatic usage kills process after function call
      // - tui usage manages mutation of entropy instance itself
      await entropy.close()
      entropy = await loadEntropy(address, endpoint, password)
    }
  }
  else {
    entropy = await loadEntropy(address, endpoint, password)
  }
}

const program = new Command()

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
    const { account, endpoint, password } = actionCommand.opts()
    const address = actionCommand.name() === 'balance'
      ? actionCommand.args[0]
      : account

    console.log(_thisCommand.name(), actionCommand.name())
    await setEntropyGlobal(address, endpoint, password)
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
