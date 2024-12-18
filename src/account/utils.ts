import { ACCOUNTS_CONTENT } from './constants';
import { EntropyAccountConfig } from "../config/types";
import * as config from "../config";
import { generateAccountChoices, findAccountByAddressOrName } from '../common/utils';

export async function selectAndPersistNewAccount (newAccount: EntropyAccountConfig) {
  const storedConfig = await config.get()
  const { accounts } = storedConfig

  const isExistingName = accounts.find(account => account.name === newAccount.name)
  if (isExistingName) {
    throw Error(`An account with name "${newAccount.name}" already exists. Choose a different name`)
  }
  const isExistingAddress = accounts.find(account => account.address === newAccount.address)
  if (isExistingAddress) {
    throw Error(`An account with address "${newAccount.address}" already exists.`)
  }

  // persist to config, set selectedAccount
  accounts.push(newAccount)
  await config.set({
    ...storedConfig,
    selectedAccount: newAccount.name
  })
}

export async function addVerifyingKeyToAccountAndSelect (verifyingKey: string, accountNameOrAddress: string) {
  const storedConfig = await config.get()
  const { accounts } = storedConfig

  const account = findAccountByAddressOrName(accounts, accountNameOrAddress)
  if (!account) throw Error(`Unable to persist verifyingKey "${verifyingKey}" to unknown account "${accountNameOrAddress}"`)

  // persist to config, set selectedAccount
  account.data.registration.verifyingKeys.push(verifyingKey)
  await config.set({
    ...storedConfig,
    selectedAccount: account.name
  })
}

function validateSeedInput (seed) {
  if (seed.includes('#debug')) return true
  if (seed.length === 66 && seed.startsWith('0x')) return true
  if (seed.length === 64) return true
  return ACCOUNTS_CONTENT.seed.invalidSeed
}

export const accountImportQuestions = [
  {
    type: 'input',
    name: ACCOUNTS_CONTENT.seed.name,
    message: ACCOUNTS_CONTENT.seed.message,
    validate: validateSeedInput,
    when: ({ importKey }) => importKey
  },
  {
    type: 'input',
    name: ACCOUNTS_CONTENT.path.name,
    message: ACCOUNTS_CONTENT.path.message,
    default: ACCOUNTS_CONTENT.path.default,
    when: ({ importKey }) => importKey
  },
]

export const accountNewQuestions = [
  {
    type: 'confirm',
    name: ACCOUNTS_CONTENT.importKey.name,
    message: ACCOUNTS_CONTENT.importKey.message,
    default: ACCOUNTS_CONTENT.importKey.default,
  },
  ...accountImportQuestions,
  {
    type: 'input',
    name: ACCOUNTS_CONTENT.name.name,
    default: ACCOUNTS_CONTENT.name.default,
  },
]

export const accountSelectQuestions = (accounts: EntropyAccountConfig[]) => [{
  type: 'list',
  name: ACCOUNTS_CONTENT.selectAccount.name,
  message: ACCOUNTS_CONTENT.selectAccount.message,
  choices: generateAccountChoices(accounts)
}]

export const accountManageQuestions = [
  {
    type: 'list',
    name: ACCOUNTS_CONTENT.interactionChoice.name,
    pageSize: ACCOUNTS_CONTENT.interactionChoice.choices.length,
    choices: ACCOUNTS_CONTENT.interactionChoice.choices
  }
]
