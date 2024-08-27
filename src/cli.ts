#! /usr/bin/env node

/* NOTE: calling this file entropy.ts helps commander parse process.argv */
import { Command, Option } from 'commander'
import launchTui from './tui'
import { EntropyTuiOptions } from './types'
import * as config from './config'

import { cliListAccounts } from './flows/manage-accounts/cli'
import { cliSign } from './flows/sign/cli'

import { cliWrite, passwordOption, endpointOption, currentAccountAddressOption } from './common/utils-cli'
import { entropyProgramCommand } from './program/command'
import { getSelectedAccount, stringify, } from './common/utils'
import Entropy from '@entropyxyz/sdk'
import { initializeEntropy } from './common/initializeEntropy'
import { BalanceCommand } from './balance/command'
import { TransferCommand } from './transfer/command'

const program = new Command()

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
    const { account, endpoint, password } = actionCommand.opts()
    const address = actionCommand.name() === 'balance'
      ? actionCommand.args[0]
      : account

    if (entropy) {
      const currentAddress = entropy?.keyring?.accounts?.registration?.address
      if (currentAddress !== address) {
        entropy.close()
        entropy = await loadEntropy(address, endpoint, password)
      }
    }
    else {
      entropy = await loadEntropy(address, endpoint, password)
    }
  })
  .action((options: EntropyTuiOptions) => {
    launchTui(entropy, options)
  })

/* Install commands */
// entropyAccount(program)
// entropyBalance(program)
// entropySession(program)
// entropySign(program)
entropyProgramCommand(entropy, program)
// entropyTransfar(program)

/* list */
program.command('list')
  .alias('ls')
  .description('List all accounts. Output is JSON of form [{ name, address, data }]')
  .action(async () => {
    // TODO: test if it's an encrypted account, if no password provided, throw because later on there's no protection from a prompt coming up
    const accounts = await cliListAccounts()
    cliWrite(accounts)
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
    cliWrite(signature)
    process.exit(0)
  })

function writeOut (result) {
  const prettyResult = stringify(result)
  process.stdout.write(prettyResult)
}

program.parseAsync().then(() => {})
