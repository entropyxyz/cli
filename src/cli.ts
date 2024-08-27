#! /usr/bin/env node

/* NOTE: calling this file entropy.ts helps commander parse process.argv */
import { Command, Option } from 'commander'
import Entropy from '@entropyxyz/sdk'
import { cliListAccounts } from './flows/manage-accounts/cli'
import { currentAccountAddressOption, endpointOption, loadEntropy, cliWrite } from './common/utils-cli'
import { entropyTransferCommand } from './transfer/command'
import { entropySignCommand } from './sign/command'
import { entropyBalanceCommand } from './balance/command'
import { EntropyTuiOptions } from './types'
import launchTui from './tui'

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
entropyTransferCommand(entropy, program)

/* Sign */
entropySignCommand(entropy, program)

program.parseAsync().then(() => {})
