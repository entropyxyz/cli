import inquirer from 'inquirer'
import { print } from '../../common/utils'
import { newKey } from './new-key'
import { selectAccount } from './select-account'
import { listAccounts } from './list'
import { EntropyTuiOptions } from 'src/types'
import { EntropyLogger } from 'src/common/logger'

const actions = {
  'Create/Import Account': newKey,
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

export async function manageAccounts (config, _options: EntropyTuiOptions, logger: EntropyLogger) {
  const FLOW_CONTEXT = 'MANAGE_ACCOUNTS'
  const { choice } = await inquirer.prompt(questions)
  const responses = await actions[choice](config, logger) || {}
  logger.debug('returned config update', FLOW_CONTEXT)
  logger.debug({ accounts: responses.accounts ? responses.accounts : config.accounts, selectedAccount: responses.selectedAccount || config.selectedAccount }, FLOW_CONTEXT)
  return { accounts: responses.accounts ? responses.accounts : config.accounts, selectedAccount: responses.selectedAccount || config.selectedAccount }
}
