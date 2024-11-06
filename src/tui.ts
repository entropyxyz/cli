import { Command, Option } from 'commander'
import inquirer from 'inquirer'
import Entropy from '@entropyxyz/sdk'
import yoctoSpinner from 'yocto-spinner'
import { promisify } from 'node:util'

import * as config from './config'
import { EntropyTuiOptions } from './types'
import { logo } from './common/ascii'
import { jumpStartNetwork, print, findAccountByAddressOrName } from './common/utils'
import { loadEntropy, accountOption, endpointOption } from './common/utils-cli'
import { EntropyLogger } from './common/logger'

import { entropyAccount, entropyRegister } from './account/interaction'
import { entropySign } from './sign/interaction'
import { entropyBalance } from './balance/interaction'
import { entropyTransfer } from './transfer/interaction'
import { entropyFaucet } from './faucet/interaction'
import { entropyProgram, entropyProgramDev } from './program/interaction'

export function entropyTuiCommand () {
  return new Command('tui')
    .description('Text-based User Interface (interactive)')

    .addOption(accountOption())
    .addOption(endpointOption())
    .addOption(
      new Option(
        '-d, --dev',
        'Runs entropy in a developer mode uses the dev endpoint as the main endpoint and allows for faucet option to be available in the main menu'
      )
        .env('DEV_MODE')
        .hideHelp()
    )
    .action(tuiAction)
}

// tui = text user interface
export async function tuiAction (options: EntropyTuiOptions) {
  const { account, endpoint } = options
  const promiseEntropy = account
    ? loadEntropy(account, endpoint)
    : Promise.resolve(undefined)
    // NOTE: on initial startup you have no account

  const logger = new EntropyLogger('TUI', options.endpoint)
  console.clear()
  const lines = logo.split('\n')
  const lineTime = 1800 / lines.length
  for (const line of lines) {
    console.log(line)
    await promisify(setTimeout)(lineTime)
  }
  logger.debug(options)

  let choices = [
    'Manage Accounts',
    'Entropy Faucet',
    'Balance',
    'Register',
    'Sign',
    'Transfer',
    // TODO: design programs in TUI (merge deploy+user programs)
    'Deploy Program',
    'User Programs',
  ]

  const devChoices = [
    'Jumpstart Network',
    // 'Create and Fund Faucet(s)'
  ]

  if (options.dev) {
    choices = [...choices, ...devChoices]
  }

  // assign exit so its last
  choices = [...choices, 'Exit']

  const entropy = await promiseEntropy
  main(entropy, choices, options, logger)
}

const loader = yoctoSpinner()
async function setupConfig () {
  let storedConfig = await config.get()

  // set selectedAccount if we can
  if (!storedConfig.selectedAccount && storedConfig.accounts.length) {
    storedConfig = await config.setSelectedAccount(storedConfig.accounts[0])
  }

  return storedConfig
}

async function main (entropy: Entropy, choices: string[], options: EntropyTuiOptions, logger: EntropyLogger) {
  if (loader.isSpinning) loader.stop()
  const storedConfig = await setupConfig()

  // Entropy is undefined on initial install, after user creates their first account,
  // entropy should be loaded
  if (storedConfig.selectedAccount && !entropy) {
    entropy = await loadEntropy(storedConfig.selectedAccount, options.endpoint)
  }

  // If the selected account changes within the TUI we need to reset the entropy instance being used
  const currentAccount = findAccountByAddressOrName(
    storedConfig.accounts,
    entropy?.keyring?.accounts?.registration?.address
  )
  if (currentAccount && currentAccount.name !== storedConfig.selectedAccount) {
    await entropy.close()
    entropy = await loadEntropy(storedConfig.selectedAccount, options.endpoint);
  }

  const answers = await inquirer.prompt([{
    type: 'list',
    name: 'choice',
    message: 'Select Action',
    pageSize: choices.length,
    choices,
  }])

  if (answers.choice === 'Exit')  {
    print('Have a nice day')
    process.exit()
  }

  let returnToMain: boolean | undefined = undefined;

  if (!storedConfig.selectedAccount && answers.choice !== 'Manage Accounts') {
    console.error('There are currently no accounts available, please create or import your new account using the Manage Accounts feature')
  } else {
    logger.debug(answers)

    switch (answers.choice) {
    case 'Manage Accounts': {
      const response = await entropyAccount(options.endpoint, storedConfig)
      if (response === 'exit') { returnToMain = true }
      break
    }
    case 'Register': {
      await entropyRegister(entropy, options.endpoint, storedConfig)
      break
    }
    case 'Balance': {
      await entropyBalance(entropy, options.endpoint, storedConfig)
        .catch(err => console.error('There was an error retrieving balance', err))
      break
    }
    case 'Transfer': {
      await entropyTransfer(entropy, options.endpoint)
        .catch(err => console.error('There was an error sending the transfer', err))
      break
    }
    case 'Sign': {
      await entropySign(entropy, options.endpoint)
        .catch(err => console.error('There was an issue with signing', err))
      break
    }
    case 'Entropy Faucet': {
      try {
        await entropyFaucet(entropy, options, logger)
      } catch (error) {
        console.error('There was an issue with running the faucet', error);
      }
      break
    }
    case 'User Programs': {
      await entropyProgram(entropy, options.endpoint)
        .catch(err => console.error('There was an error with programs', err))
      break
    }
    case 'Deploy Program': {
      await entropyProgramDev(entropy, options.endpoint)
        .catch(err => console.error('There was an error with program dev', err))
      break
    }
    case 'Jumpstart Network': {
      // TO-DO: possibly move this to it's own directory similar to the other actions
      // could create a new system directory for system/network level functionality
      // i.e jumpstarting, deploy faucet, etc.
      loader.text = 'Jumpstarting Network...'
      try {
        loader.start()
        const jumpStartStatus = await jumpStartNetwork(entropy, options.endpoint)

        if (jumpStartStatus.isFinalized) {
          loader.clear()
          loader.success('Network jumpstarted!')
          // running into an issue where the loader displays the success message but the return to main menu
          // prompt does not display, so for now exiting process
          process.exit(0)
        }
      } catch (error) {
        loader.text = 'Jumpstart Failed'
        loader.stop()
        loader.clear()
        console.error('There was an issue jumpstarting the network', error);
        process.exit(1)
      }
      break
    }
    default: {
      console.error('Unsupported Action:' + answers.choice)
      break
    }
    }
  }

  if (returnToMain === undefined) {
    ({ returnToMain } = await inquirer.prompt([{
      type: 'confirm',
      name: 'returnToMain',
      message: 'Return to main menu?'
    }]))
  }

  if (returnToMain) main(entropy, choices, options, logger)
  else {
    print('Have a nice day')
    process.exit()
  }
}
