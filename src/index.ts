import inquirer from 'inquirer'
import * as config from './config'
import * as flows from './flows'
import { ascii } from './common/ascii'
import { print, debug, getActiveOptions } from './common/utils'

config.init()

console.clear()
print(ascii)

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

// @frankie correct me if i'm wrong, but i don't believe we are releasing with the faucet right?
// const devChoices = {
//   'Entropy Faucet': flows.entropyFaucet,
// }

const choices = {
  'Manage Accounts': flows.manageAccounts,
  'Balance': flows.checkBalance,
  'Register': flows.register,
  'Sign': flows.sign,
  'Transfer': flows.entropyTransfer,
  'Deploy Program': flows.devPrograms,
  'User Programs': flows.userPrograms,
}

// if (setOptions.DEV_MODE) Object.assign(choices, devChoices)

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
    const newConfigUpdates = await choices[answers.choice](storedConfig, setOptions)
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
