import * as config from './src/config'
import inquirer from 'inquirer'
import * as flows from './src/flows'
import { ascii } from './src/common/ascii'
import { getActiveOptions } from './src/common/utils'

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
    key: 'ENDPOINT',
    define: 'Runs entropy with the given endpoint and ignores network endpoints in config`entropy --endpoint=ws://127.0.0.1:9944` can also be given a stored endpoint name from config eg: `entropy --endpoint test-net`',
  },
]

console.log('args', process.argv)
const setOptions = getActiveOptions(options)

const devChoices = {
  'Entropy Faucet': undefined,
}

const choices = {
  'Balance': flows.checkBalance,
  'Deploy Program': async () => {},
  'User Programs': async () => {},
  'Register': async () => {},
  'Construct an Ethereum Tx': async () => {},
  'Sign': async () => {},
  'Transfer': async () => {},
  'Give Zaps': async () => {},
  'Create/Import New Key': async () => {},
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

main()
const returnToMainMenu = {
  type: 'confirm',
  name: 'returnToMain',
  message: 'Return to main menu?'
}


export async function main () {
  const answers = await inquirer.prompt([intro])
  const { choice } = answers
  const user = await config.get()
  console.log('user',user)
  if (!user.accounts.length) {

  }
  if (choice === 'Exit') return console.log('Have a nice day')
    console.log('choice', answers, Object.keys(choices))
  await flows[choice]
  const { returnToMain } = await inquirer.prompt([returnToMainMenu])
  if (returnToMain) main()
  console.log('Have a nice day')
}





