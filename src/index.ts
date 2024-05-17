import inquirer from 'inquirer'
import * as config from './config'
import * as flows from './flows'
import { ascii } from './common/ascii'
import { debug, getActiveOptions } from './common/utils'

config.init()

console.clear()
console.log(ascii)

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

const setOptions = getActiveOptions(options)

const devChoices = {
  'Entropy Faucet': flows.entropyFaucet,
}

const choices = {
  'Balance': flows.checkBalance,
  'Register': flows.register,
  'Transfer': flows.entropyTransfer,
  'Sign': flows.sign,
  'Wallet': flows.wallet,
  'User Programs': flows.userPrograms,
  'Deploy Program': flows.devPrograms,
  // 'Entropy Faucet': flows.entropyFaucet,
  // 'Construct an Ethereum Tx': flows.ethTransaction,
  // 'Give Zaps': flows.giveZaps,
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

export async function main () {
  const storedConfig = await config.get()
  debug('stored config:', storedConfig)
  
  const answer = await inquirer.prompt([intro])
  debug('answer:', answer)
  if (answer.choice === 'Exit')  {
    console.log('Have a nice day')
    process.exit()
  }

  const user = await config.get()
  debug('user:', user)
  if (!user.accounts.length) {
    console.log("User accounts is empty")
  }

  const flow = choices[answer.choice]
  const newConfigUpdates = await flow(storedConfig, setOptions)

  if (newConfigUpdates) await config.set({ ...storedConfig, ...newConfigUpdates })

  const { returnToMain } = await inquirer.prompt([returnToMainMenu])
  if (returnToMain) main()

  console.log('Have a nice day')
}
