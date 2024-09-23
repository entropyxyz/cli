#! /usr/bin/env node

/* NOTE: calling this file entropy.ts helps commander parse process.argv */
import { Command, Option } from 'commander'

import { EntropyTuiOptions } from './types'
import { currentAccountAddressOption, endpointOption, loadEntropy } from './common/utils-cli'

import launchTui from './tui'
import { entropyAccountCommand } from './account/command'
import { entropyTransferCommand } from './transfer/command'
import { entropySignCommand } from './sign/command'
import { entropyBalanceCommand } from './balance/command'

const program = new Command()

/* no command */
program
  .name('entropy')
  .description('CLI interface for interacting with entropy.xyz. Running this binary without any commands or arguments starts a text-based interface.')
  .addOption(currentAccountAddressOption())
  .addOption(endpointOption())
  // NOTE: I think this is currently unused
  .addOption(
    new Option(
      '-d, --dev',
      'Runs entropy in a developer mode uses the dev endpoint as the main endpoint and allows for faucet option to be available in the main menu'
    )
      .env('DEV_MODE')
      .hideHelp()
  )
  .addCommand(entropyBalanceCommand())
  .addCommand(entropyAccountCommand())
  .addCommand(entropyTransferCommand())
  .addCommand(entropySignCommand())
  .action(async (options: EntropyTuiOptions) => {
    const { account, endpoint } = options
    const entropy = await loadEntropy(account, endpoint)
    launchTui(entropy, options)
  })

program.parseAsync().then(() => {})
