import inquirer from 'inquirer'
import * as config from './config'
import * as flows from './flows'
import { ascii } from './common/ascii'
import { getActiveOptions } from './common/utils'

// TODO: extract, replace with e.g. minimist
export const options = [
  {
    long: '--dev',
    short: '-d',
    key: 'DEV_MODE',
    define: 'Runs entropy in a developer mode uses the dev endpoint as the main endpoint and allows for faucet option to be available in the main menu',
  },
  {
    long: '--endpoint',
    short: '-e',
    default: 'test-net',
    key: 'ENDPOINT',
    define: 'Runs entropy with the given endpoint and ignores network endpoints in config`entropy --endpoint ws://testnet.entropy.xyz:9944/` can also be given a stored endpoint name from config eg: `entropy --endpoint test-net`',
  },
]

// tui = text user interface
export default function tui () {
  config.init()

  console.clear()
  console.log(ascii)

  const setOptions = getActiveOptions(options)

  const choices = {
    'Balance': flows.checkBalance,
    'Deploy Program': flows.devPrograms,
    'User Programs': flows.userPrograms,
    'Register': flows.register,
    // 'Entropy Faucet': flows.entropyFaucet,
    // 'Construct an Ethereum Tx': flows.ethTransaction,
    'Sign': flows.sign,
    'Transfer': flows.entropyTransfer,
    'Give Zaps': flows.giveZaps,
    'Wallet': flows.wallet,
  }

  const devChoices = {
    'Entropy Faucet': flows.entropyFaucet,
  }

  if (setOptions.DEV_MODE) Object.assign(choices, devChoices)

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
    const newConfigUpdates = await choices[answers.choice](storedConfig, setOptions)

    if (newConfigUpdates) await config.set({ ...storedConfig, ...newConfigUpdates })

    const { returnToMain } = await inquirer.prompt([returnToMainMenu])
    if (returnToMain) main()
    console.log('Have a nice day')
  }
}
