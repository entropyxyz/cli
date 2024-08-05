import inquirer from 'inquirer'
import Entropy from '@entropyxyz/sdk'
import * as config from './config'
import * as flows from './flows'
import { EntropyTuiOptions } from './types'
import { logo } from './common/ascii'
import { print } from './common/utils'
import { EntropyLogger } from './common/logger'
import { BalanceCommand } from './balance/command'

let shouldInit = true

// tui = text user interface
export default function tui (entropy: Entropy, options: EntropyTuiOptions) {
  const logger = new EntropyLogger('TUI', options.endpoint)
  console.clear()
  console.log(logo) // the Entropy logo
  logger.debug(options)

  const choices = {
    'Manage Accounts': flows.manageAccounts,
    // leaving as a noop function until all flows are restructured
    'Balance': () => {},
    'Register': flows.entropyRegister,
    'Sign': flows.sign,
    'Transfer': flows.entropyTransfer,
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
    case "Balance": {
      const balanceCommand = new BalanceCommand(entropy, options.endpoint)
      const balanceString = await balanceCommand.getBalance(storedConfig.selectedAccount)
      print(`Address ${storedConfig.selectedAccount} has a balance of: ${balanceString}`)
      break;
    }
    default: {
      const newConfigUpdates = await choices[answers.choice](storedConfig, options, logger)
      if (typeof newConfigUpdates === 'string' && newConfigUpdates === 'exit') {
        returnToMain = true
      } else {
        await config.set({ ...storedConfig, ...newConfigUpdates })
      }
      storedConfig = await config.get()
      break;
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
