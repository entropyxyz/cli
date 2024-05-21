import inquirer from 'inquirer'
import * as config from './config'
import * as flows from './flows'
import { EntropyTuiOptions } from './types'
import { ascii } from './common/ascii'
import { debug } from './common/utils'

// tui = text user interface
export default function tui (options: EntropyTuiOptions) {
  config.init()

  console.clear()
  console.log(ascii)
  debug(options)

  const choices = {
    'Manage Accounts': flows.wallet,
    'Balance': flows.checkBalance,
    'Register': flows.register,
    'Sign': flows.sign,
    'Transfer': flows.entropyTransfer,
    // 'Deploy Program': flows.devPrograms,
    // 'User Programs': flows.userPrograms,
    // 'Entropy Faucet': flows.entropyFaucet,
    // 'Construct an Ethereum Tx': flows.ethTransaction,
  }

  const devChoices = {
    'Entropy Faucet': flows.entropyFaucet,
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
    const storedConfig = await config.get()
    console.log('stored config', storedConfig);
    
    const answers = await inquirer.prompt([intro])
    const user = await config.get()
    console.log('user',user)
    if (!user.accounts.length) {
      console.log("User accounts is empty")
    }

    if (answers.choice === 'Exit')  {
      console.log('Have a nice day')
      process.exit()
    }
    console.log(answers)
    const newConfigUpdates = await choices[answers.choice](storedConfig, options)

    if (newConfigUpdates) await config.set({ ...storedConfig, ...newConfigUpdates })

    const { returnToMain } = await inquirer.prompt([returnToMainMenu])
    if (returnToMain) main()
    console.log('Have a nice day')
  }
}
