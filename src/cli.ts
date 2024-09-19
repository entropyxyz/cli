#! /usr/bin/env node

/* NOTE: calling this file entropy.ts helps commander parse process.argv */
import { Command, Option } from 'commander'

import { entropyAccountCommand } from './account/command'
import { entropyTransferCommand } from './transfer/command'
import { entropySignCommand } from './sign/command'
import { entropyBalanceCommand } from './balance/command'
import { entropyProgramCommand } from './program/command'

import launchTui from './tui'
import { EntropyTuiOptions } from './types'
import { currentAccountAddressOption, endpointOption, loadEntropy } from './common/utils-cli'

// import launchTui from './tui'
// import { EntropyTuiOptions } from './types'
// import * as config from './config'

// import { cliListAccounts } from './flows/manage-accounts/cli'
// import { cliSign } from './flows/sign/cli'

// import { cliWrite, passwordOption, endpointOption, currentAccountAddressOption } from './common/utils-cli'
// import { getSelectedAccount, stringify, } from './common/utils'
// import Entropy from '@entropyxyz/sdk'
// import { initializeEntropy } from './common/initializeEntropy'
// import { BalanceCommand } from './balance/command'
// import { TransferCommand } from './transfer/command'

// const program = new Command()

// let entropy: Entropy

// export async function loadEntropy (address: string, endpoint: string, password?: string): Promise<Entropy> {
//   const storedConfig = config.getSync()
//   const selectedAccount = getSelectedAccount(storedConfig.accounts, address)

//   if (!selectedAccount) throw Error(`No account with address ${address}`)

//   // check if data is encrypted + we have a password
//   if (typeof selectedAccount.data === 'string' && !password) {
//     throw Error('This account requires a password, add --password <password>')
//   }

//   entropy = await initializeEntropy({ keyMaterial: selectedAccount.data, endpoint, password })

//   if (!entropy?.keyring?.accounts?.registration?.pair) {
//     throw new Error("Signer keypair is undefined or not properly initialized.")
//   }

//   return entropy
// }

const program = new Command()

/* no command */
program
  .name('entropy')
  .description('CLI interface for interacting with entropy.xyz. Running without commands starts an interactive ui')
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
  .addCommand(entropyProgramCommand())
  .action(async (options: EntropyTuiOptions) => {
    const { account, endpoint } = options
    const entropy = await loadEntropy(account, endpoint)
    launchTui(entropy, options)
  })

program.parseAsync().then(() => {})
