import inquirer from 'inquirer'
import Entropy from '@entropyxyz/sdk'
import * as config from './config'
import * as flows from './flows'
import { EntropyTuiOptions } from './types'
import { logo } from './common/ascii'
import { print, updateConfig } from './common/utils'
import { loadEntropy } from './common/utils-cli'
import { EntropyLogger } from './common/logger'
import { entropyManageAccounts, entropyRegister } from './account/interaction'
import { entropySign } from './sign/interaction'
import { entropyBalance } from './balance/interaction'
import { entropyTransfer } from './transfer/interaction'

async function setupConfig () {
  let storedConfig = await config.get()

  // set selectedAccount if we can
  if (!storedConfig.selectedAccount && storedConfig.accounts.length) {
    await config.set({ 
      selectedAccount: storedConfig.accounts[0].address,
      ...storedConfig
    })
    storedConfig = await config.get()
  }

  return storedConfig
}

// tui = text user interface
export default function tui (entropy: Entropy, options: EntropyTuiOptions) {
  const logger = new EntropyLogger('TUI', options.endpoint)
  console.clear()
  console.log(logo) // the Entropy logo
  logger.debug(options)

  const choices = {
    'Manage Accounts': () => {},
    // leaving as a noop function until all flows are restructured
    'Balance': () => {},
    'Register': () => {},
    'Sign': () => {},
    'Transfer': () => {},
    // TODO: design programs in TUI (merge deploy+user programs)
    'Deploy Program': flows.devPrograms,
    'User Programs': flows.userPrograms,
    // 'Construct an Ethereum Tx': flows.ethTransaction,
  }

  // const devChoices = {
  //   // 'Entropy Faucet': flows.entropyFaucet,
  // }

  // if (options.dev) Object.assign(choices, devChoices)

  // assign exit so its last
  Object.assign(choices, { 'Exit': async () => {} })

  main(entropy, choices, options, logger)
}

async function main (entropy: Entropy, choices, options, logger: EntropyLogger) {
  let storedConfig = await setupConfig()
  
  // If the selected account changes within the TUI we need to reset the entropy instance being used
  const currentAccount = entropy?.keyring?.accounts?.registration?.address
  if (currentAccount && currentAccount !== storedConfig.selectedAccount) {
    await entropy.close()
    entropy = await loadEntropy(storedConfig.selectedAccount, options.endpoint);
  }

  const answers = await inquirer.prompt([{
    type: 'list',
    name: 'choice',
    message: 'Select Action',
    pageSize: Object.keys(choices).length,
    choices: Object.keys(choices),
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
      const response = await entropyManageAccounts(options.endpoint, storedConfig)
      returnToMain = await updateConfig(storedConfig, response)
      storedConfig = await config.get()
      break
    }
    case 'Register': {
      const { accounts, selectedAccount } = await entropyRegister(entropy, options.endpoint, storedConfig)
      returnToMain = await updateConfig(storedConfig, { accounts, selectedAccount })
      storedConfig = await config.get()
      break
    }
    case 'Balance': {
      try {
        await entropyBalance(entropy, options.endpoint, storedConfig)
      } catch (error) {
        console.error('There was an error retrieving balance', error)
      }
      break
    }
    case 'Transfer': {
      try {
        await entropyTransfer(entropy, options.endpoint)
      } catch (error) {
        console.error('There was an error sending the transfer', error)
      }
      break
    }
    case 'Sign': {
      try {
        await entropySign(entropy, options.endpoint)
      } catch (error) {
        console.error('There was an issue with signing', error)
      }
      break
    }
    default: {
      const newConfigUpdates = await choices[answers.choice](storedConfig, options, logger)
      if (typeof newConfigUpdates === 'string' && newConfigUpdates === 'exit') {
        returnToMain = true
      } else {
        await config.set({ ...storedConfig, ...newConfigUpdates })
      }
      storedConfig = await config.get()
    }
    }
  }

  if (!returnToMain) {
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
