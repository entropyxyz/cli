#! /usr/bin/env node

/* NOTE: calling this file entropy.ts helps commander parse process.argv */
import { Command } from 'commander'

import * as config from './config'

import { entropyTuiCommand as tui } from './tui'
import { entropyAccountCommand as account } from './account/command'
import { entropyTransferCommand as transfer } from './transfer/command'
import { entropySignCommand as sign } from './sign/command'
import { entropyBalanceCommand as balance } from './balance/command'
import { entropyProgramCommand as program } from './program/command'

const cli = new Command()

/* no command */
cli
  .name('entropy')
  .description([
    'CLI interface for interacting with entropy.xyz.',
    'Running this binary without any commands or arguments starts a text-based user interface (TUI).'
  ].join(' '))

  .addCommand(balance())
  .addCommand(account())
  .addCommand(transfer())
  .addCommand(sign())
  .addCommand(program())
  .addCommand(tui(), { isDefault: true })
  // NOTE: this sets `entropy tui` as the fallback command if `entropy` is called
  // The advantage of this is now the tui is a subcommand which means there
  // are no collisions with root program vs sub-command options

  .hook('preAction', async () => {
    // set up config file, run migrations
    return config.init()
  })

cli.parseAsync()
