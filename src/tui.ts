import inquirer from 'inquirer'
import * as config from './config'
import * as flows from './flows'
import { EntropyTuiOptions } from './types'
import { logo } from './common/ascii'
import { debug, print } from './common/utils'

// tui = text user interface
export default function tui (options: EntropyTuiOptions) {
  config.init()

  console.clear()
  const icon = ['@', '#', '%', 'α', 'ε'].sort(() => Math.random() - 0.5).pop()
  console.log(logo(icon)) // the Entropy logo
  debug(options)

  const choices = {
    'Manage Accounts': flows.manageAccounts,
    'Balance': flows.checkBalance,
    'Register': flows.register,
    'Sign': flows.sign,
    'Transfer': flows.entropyTransfer,
    'Deploy Program': flows.devPrograms,
    'User Programs': flows.userPrograms,
    // 'Construct an Ethereum Tx': flows.ethTransaction,
  }

  const devChoices = {
    // 'Entropy Faucet': flows.entropyFaucet,
  }

  if (options.dev) Object.assign(choices, devChoices)

  // assign exit so its last
  Object.assign(choices, { 'Exit': async () => {} })

  const intro = {
    type: 'list',
    name: 'choice',
    message: 'Select Action',
    pageSize: Object.keys(choices).length,
    choices: Object.keys(choices),
  }

  const returnToMainMenu = {
    type: 'confirm',
    name: 'returnToMain',
    message: 'Return to main menu?'
  }

  main()

  async function main () {
    let storedConfig = await config.get()

    // if there are accounts available and selected account is not set, 
    // first account in list is set as the selected account
    if (!storedConfig.selectedAccount && storedConfig.accounts.length) {
      await config.set({ ...storedConfig, ...{ selectedAccount: storedConfig.accounts[0].address } })
      storedConfig = await config.get()
    }

    const answers = await inquirer.prompt([intro])

    if (answers.choice === 'Exit')  {
      print('Have a nice day')
      process.exit()
    }

    let returnToMain: boolean | undefined = undefined;

    if (!storedConfig.selectedAccount && answers.choice !== 'Manage Accounts') {
      console.error('There are currently no accounts available, please create or import your new account using the Manage Accounts feature')
    } else {
      debug(answers)
      const newConfigUpdates = await choices[answers.choice](storedConfig, options)
      if (typeof newConfigUpdates === 'string' && newConfigUpdates === 'exit') {
        returnToMain = true
      } else {
        await config.set({ ...storedConfig, ...newConfigUpdates })
      }
      storedConfig = await config.get()
    }

    if (!returnToMain) {
      ({ returnToMain } = await inquirer.prompt([returnToMainMenu]))
    }
    if (returnToMain) main()
    else {
      print('Have a nice day')
      process.exit()
    }
  }
}
