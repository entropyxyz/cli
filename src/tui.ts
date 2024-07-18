import inquirer from 'inquirer'
import * as config from './config'
import * as flows from './flows'
import { EntropyTuiOptions } from './types'
import { logo } from './common/ascii'
import { print } from './common/utils'
import { EntropyLogger } from './common/logger'

export const RETURN_TO_MAIN = 'returnToMainMenu'

let shouldInit = true

// tui = text user interface
export default function tui (options: EntropyTuiOptions) {
  const logger = new EntropyLogger('TUI', options.endpoint)
  console.clear()
  console.log(logo) // the Entropy logo
  logger.debug(options)

  const choices = {
    'Manage Accounts': flows.manageAccounts,
    'Balance': flows.checkBalance,
    'Register': flows.entropyRegister,
    'Sign': flows.sign,
    'Transfer': flows.entropyTransfer,
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

  main(choices, options, logger)
}

async function main (choices, options, logger: EntropyLogger) {
  if (shouldInit) {
    await config.init()
    shouldInit = false
  }

  let storedConfig = await config.get()

  // if there are accounts available and selected account is not set, 
  // first account in list is set as the selected account
  if (!storedConfig.selectedAccount && storedConfig.accounts.length) {
    await config.set({ ...storedConfig, ...{ selectedAccount: storedConfig.accounts[0].address } })
    storedConfig = await config.get()
  }

  const answers = await inquirer.prompt([{
    type: 'list',
    name: 'choice',
    message: 'Select Action',
    pageSize: Object.keys(choices).length,
    choices: Object.keys(choices),
  }])
  if (answers.choice === 'Exit') exit()

  if (!storedConfig.selectedAccount && answers.choice !== 'Manage Accounts') {
    console.error('There are currently no accounts available, please create or import your new account using the Manage Accounts feature')
  } else {
    logger.debug(answers)
    const newConfigUpdates = await choices[answers.choice](storedConfig, options, logger)
    // TODO: choices should return type EntropyConfig | String

    if (isConfig(newConfigUpdates)) {
      await config.set({ ...storedConfig, ...newConfigUpdates })
    }
  }

  main(choices, options, logger)
}

function isConfig (config) {
  if (config === RETURN_TO_MAIN) return false
  if (typeof config !== 'object') return false
  return true
}

function exit () {
  print('Have a nice day')
  process.exit()
}
