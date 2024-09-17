#! /usr/bin/env node

/* NOTE: calling this file entropy.ts helps commander parse process.argv */
import { Command, Option } from 'commander'
import Entropy from '@entropyxyz/sdk'

import * as config from './config'
import { EntropyTuiOptions } from './types'
import { currentAccountAddressOption, endpointOption, loadEntropy } from './common/utils-cli'

import launchTui from './tui'
import { entropyAccountCommand } from './account/command'
import { entropyTransferCommand } from './transfer/command'
import { entropySignCommand } from './sign/command'
import { entropyBalanceCommand } from './balance/command'

let entropy: Entropy
async function setEntropyGlobal (address: string, endpoint: string, password?: string) {
  if (entropy) {
    const currentAddress = entropy?.keyring?.accounts?.registration?.address
    if (address !== currentAddress) {
      // QUESTION: Is it possible to hit this?
      // - programmatic usage kills process after function call
      // - tui usage manages mutation of entropy instance itself
      await entropy.close()
      entropy = await loadEntropy(address, endpoint, password)
    }
  }
  else if (address && endpoint) {
    entropy = await loadEntropy(address, endpoint, password)
  }

  return entropy
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
    const commandName = actionCommand?.name()
    await config.init()
    if (commandName === 'account') return
    // entropy not required for any account commands

    const { account, endpoint, password } = actionCommand.opts()
    const address = commandName === 'balance'
      ? actionCommand.args[0]
      : account
    
    await setEntropyGlobal(address, endpoint, password)
  })
  .addCommand(entropyBalanceCommand())
  .addCommand(entropyAccountCommand())
  .addCommand(entropyTransferCommand())
  .addCommand(entropySignCommand())
  .action((options: EntropyTuiOptions) => {
    launchTui(entropy, options)
  })

program.parseAsync().then(() => {})
