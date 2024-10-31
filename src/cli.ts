#! /usr/bin/env node

/* NOTE: calling this file entropy.ts helps commander parse process.argv */
import { Command } from 'commander'

import * as config from './config'
import { print } from './common/utils'

import { entropyTuiCommand as tui, /* tuiAction */ } from './tui'
import { entropyAccountCommand as account } from './account/command'
import { entropyTransferCommand as transfer } from './transfer/command'
import { entropySignCommand as sign } from './sign/command'
import { entropyBalanceCommand as balance } from './balance/command'
import { entropyProgramCommand as program } from './program/command'

const packageVersion = 'v' + require('../package.json').version
const coreVersion = process.env.ENTROPY_CORE_VERSION.split('-')[1]

const cli = new Command()

/* no command */
cli
  .name('entropy')
  .description('CLI interface for interacting with entropy.xyz.')

  .addCommand(tui())
  .addCommand(account())
  .addCommand(sign())
  .addCommand(balance())
  .addCommand(transfer())
  .addCommand(program())

  .option('-v, --version', 'Displays the current running version of Entropy CLI')
  .option('-cv, --core-version', 'Displays the current running version of the Entropy Protocol')
  .action(opts => {
    if (opts.version) {
      print(packageVersion)
      process.exit(0)
    }
    if (opts.coreVersion) {
      print(coreVersion)
      process.exit(0)
    }

    // print entropy help and exit
    cli.help()

    // tuiAction(opts)
    // NOTE: this doesn't quite work, because -a, -e are not defined as options
    // and if we do put them in here it gets a bit confusing
  })

  // set up config file, run migrations
  .hook('preAction', async () => {
    return config.init()
  })

cli.parseAsync()
