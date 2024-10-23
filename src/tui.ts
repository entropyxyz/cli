import inquirer from 'inquirer'
import Entropy from '@entropyxyz/sdk'
import * as config from './config'
import { CONFIG_PATH_DEFAULT } from './config'
import { EntropyTuiOptions } from './types'
import { logo } from './common/ascii'
import { print } from './common/utils'
import { ENTROPY_ENDPOINT_DEFAULT } from './common/constants'
import { loadEntropy } from './common/utils-cli'
import { EntropyLogger } from './common/logger'

import { entropyAccount, entropyRegister } from './account/interaction'
import { entropySign } from './sign/interaction'
import { entropyBalance } from './balance/interaction'
import { entropyTransfer } from './transfer/interaction'
import { entropyFaucet } from './faucet/interaction'
import { entropyProgram, entropyProgramDev } from './program/interaction'

// tui = text user interface
export default async function tui (opts: EntropyTuiOptions) {
  const options = {
    ...opts,
    config: CONFIG_PATH_DEFAULT,
    endpoint: ENTROPY_ENDPOINT_DEFAULT
  }

  const logger = new EntropyLogger('TUI', options.endpoint)
  console.clear()
  console.log(logo) // the Entropy logo
  logger.debug(options)

  const storedConfig = await setupConfig(options.config)
  const entropy = await loadEntropy({
    account: storedConfig.selectedAccount,
    config: storedConfig,
    endpoint: options.endpoint
  })

  const choices = [
    'Manage Accounts',
    'Entropy Faucet',
    'Balance',
    'Register',
    'Sign',
    'Transfer',
    // TODO: design programs in TUI (merge deploy+user programs)
    'Deploy Program',
    'User Programs',
    'Exit'
  ]


  main(entropy, choices, options, logger)
}

async function setupConfig (configPath) {
  let storedConfig = await config.get(configPath)

  // set selectedAccount if we can
  if (!storedConfig.selectedAccount && storedConfig.accounts.length) {
    storedConfig = await config.setSelectedAccount(storedConfig.accounts[0])
  }

  return storedConfig
}

async function main (entropy: Entropy, choices, options, logger: EntropyLogger) {
  const storedConfig = await setupConfig(options.config)

  // Entropy is undefined on initial install
  // However, after user creates their first account, entropy can be loaded
  if (storedConfig.selectedAccount && !entropy) {
    entropy = await loadEntropy({
      account: storedConfig.selectedAccount,
      config: storedConfig,
      endpoint: options.endpoint
    })
  }

  // If the selected account changes within the TUI we reload entropy to use that account
  const currentAccount = entropy?.keyring?.accounts?.registration?.address
  if (currentAccount && currentAccount !== storedConfig.selectedAccount) {
    await entropy.close()
    entropy = await loadEntropy({
      account: storedConfig.selectedAccount,
      config: storedConfig,
      endpoint: options.endpoint
    })
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
    default: {
      throw Error(`unsupported choice: ${answers.choice}`)
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
