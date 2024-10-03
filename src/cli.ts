#! /usr/bin/env node

/* NOTE: calling this file entropy.ts helps commander parse process.argv */
import { Command, Option } from 'commander'

import { EntropyTuiOptions } from './types'
import { loadEntropy } from './common/utils-cli'
import * as config from './config'

import launchTui from './tui'
import { entropyAccountCommand } from './account/command'
import { entropyTransferCommand } from './transfer/command'
import { entropySignCommand } from './sign/command'
import { entropyBalanceCommand } from './balance/command'
import { entropyProgramCommand } from './program/command'

const program = new Command()

/* no command */
program
  .name('entropy')
  .description('CLI interface for interacting with entropy.xyz. Running this binary without any commands or arguments starts a text-based interface.')

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
  .addCommand(entropyProgramCommand())

  .action(async (opts: EntropyTuiOptions) => {
    const { account, endpoint } = opts
    const entropy = account
      ? await loadEntropy(account, endpoint)
      : undefined
    // NOTE: on initial startup you have no account
    launchTui(entropy, opts)
  })
  .hook('preAction', async () => {
    // set up config file, run migrations
    return config.init()
  })

program.parseAsync()
