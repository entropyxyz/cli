import inquirer from 'inquirer'
import { debug, print } from '../../common/utils'
import { newAccount } from './new-account'
import { selectAccount } from './select-account'
import { listAccounts } from './list'

const actions = {
  'Create/Import Account': newAccount,
  'Select Account': selectAccount,
  'List Accounts': (config) => {
    try {
      const accountsArray = listAccounts(config)
      accountsArray?.forEach(account => print(account))
      return
    } catch (error) {
      console.error(error.message);
    }
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
  debug('returned config update:', { accounts: responses.accounts ? responses.accounts : config.accounts, selectedAccount: responses.selectedAccount || config.selectedAccount })
  return { accounts: responses.accounts ? responses.accounts : config.accounts, selectedAccount: responses.selectedAccount || config.selectedAccount }
}
