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
  .description([
    'CLI interface for interacting with entropy.xyz.',
    'Running this binary without any commands or arguments starts a text-based interface.'
  ].join(' '))
  .addOption(
    new Option(
      '-d, --dev',
      [
        'Runs entropy in a developer mode uses the dev endpoint as the main endpoint and',
        'allows for faucet option to be available in the main menu'
      ].join(' ')
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
      ? await loadEntropy({ account, config: config.CONFIG_PATH, endpoint })
      : undefined
    // NOTE:
    // - on initial startup you have no account
    // - no custom config for the TUI at moment
    //     - option name collisions, see: https://github.com/tj/commander.js/issues/2260
    launchTui(entropy, opts)
  })
  .hook('preAction', async (thisCommand, actionCommand) => {
    const { config: configPath } = actionCommand.opts()

    if (configPath) await config.init(configPath)
    // set up config file, run migrations
  })

program.parseAsync()
