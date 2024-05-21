import inquirer from 'inquirer'
import { newKey } from './new-key'
import { selectAccount } from './select-account'

const actions = {
  'Select Account': selectAccount,
  'List Accounts': async (config) => {
    const accountsArray = Array.isArray(config.accounts) ? config.accounts : [config.accounts]
    accountsArray.forEach((account) => console.log(account))
  },
  'Create/Import Account': newKey,
}

const choices = Object.keys(actions)

const questions = [{
  type: 'list',
  name: 'choice',
  pageSize: choices.length,
  choices,
}]

export async function manageAccounts (config) {
  const { choice } = await inquirer.prompt(questions)
  const { accounts, selectedAccount } = await actions[choice](config)
  return { accounts: !!accounts ? accounts : config.accounts, selectedAccount }
}
