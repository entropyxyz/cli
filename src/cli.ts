#! /usr/bin/env node

/* NOTE: calling this file entropy.ts helps commander parse process.argv */
import { Command, Option } from 'commander'
import launchTui from './tui'
import { EntropyTuiOptions } from './types'

import { cliListAccounts } from './flows/manage-accounts/cli'
import Entropy from '@entropyxyz/sdk'
import { TransferCommand } from './transfer/command'
import { entropySignCommand } from './signing/command'
import { currentAccountAddressOption, endpointOption, loadEntropy, passwordOption, cliWrite } from './common/utils-cli'
import { entropyBalanceCommand } from './balance/command'

const program = new Command()
// Array of restructured commands to make it easier to migrate them to the new "flow"
const RESTRUCTURED_COMMANDS = ['balance']

let entropy: Entropy

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
        entropy = await loadEntropy(entropy, actionCommand.args[0], actionCommand.opts().endpoint, actionCommand.opts().password)
      } else {
        // if address is not an argument, use the address from the option
        entropy = await loadEntropy(entropy, actionCommand.opts().account, actionCommand.opts().endpoint, actionCommand.opts().password)
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
    cliWrite(accounts)
    process.exit(0)
  })

/* balance */
entropyBalanceCommand(entropy, program)

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
    // cliWrite(??) // TODO: write the output
    process.exit(0)
  })

/* Sign */
entropySignCommand(entropy, program)

program.parseAsync().then(() => {})
