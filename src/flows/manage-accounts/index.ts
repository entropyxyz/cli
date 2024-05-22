import inquirer from 'inquirer'
import { newKey } from './new-key'
import { selectAccount } from './select-account'

const actions = {
  'Create/Import Account': newKey,
  'Select Account': selectAccount,
  'List Accounts': async (config) => {
    const accountsArray = Array.isArray(config.accounts) ? config.accounts : [config.accounts]
    accountsArray.forEach((account) => console.log(account))
    if (!accountsArray.length) console.error('There are currently no accounts available, please create or import your new account using the Manage Accounts feature')
  },
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
  const responses = await actions[choice](config) || {}
  console.log('returned config update:', { accounts: responses.accounts ? responses.accounts : config.accounts, selectedAccount: responses.selectedAccount || config.selectedAccount })
  return { accounts: responses.accounts ? responses.accounts : config.accounts, selectedAccount: responses.selectedAccount || config.selectedAccount }
}
