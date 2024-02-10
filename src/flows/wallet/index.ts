import inquirer from 'inquirer'
import{ newKey } from './new-key'
const actions = {
   'New Key': newKey,
   'List Accounts': async (config) => { config.accounts.forEach((a) => console.log()) }
}

const choices = Object.keys(actions)

const questions = [{
  type: 'list',
  name: 'choice',
  pageSize: choices.length,
  choices,
}]


export async function wallet (config) {
  const { choice } = await inquirer.prompt(questions)
  const updated = await actions[choice](config)
  return { accounts: updated | config.accounts }
}

export async function listAccounts ({ accounts }) {

}