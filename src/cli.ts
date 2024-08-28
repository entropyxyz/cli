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

    await setEntropyGlobal(address, endpoint, password)
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
