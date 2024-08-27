// @ts-expect-error
import Keyring from '@entropyxyz/sdk/keys'
import { EntropyAccountConfig, EntropyConfig } from "../config/types";
import { CreateAccountParams, ListedAccount, RegisterParams } from './types';
import { ACCOUNTS_CONTENT } from './constants';
import { generateAccountChoices, print } from 'src/common/utils';
import Entropy from '@entropyxyz/sdk';

const validateSeedInput = (seed) => {
  if (seed.includes('#debug')) return true
  if (seed.length === 66 && seed.startsWith('0x')) return true
  if (seed.length === 64) return true
  return ACCOUNTS_CONTENT.seed.invalidSeed
}

export const importQuestions = [
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

export const newAccountQuestions = [
  {
    type: 'confirm',
    name: ACCOUNTS_CONTENT.importKey.name,
    message: ACCOUNTS_CONTENT.importKey.message,
    default: ACCOUNTS_CONTENT.importKey.default,
  },
  ...importQuestions,
  {
    type: 'input',
    name: ACCOUNTS_CONTENT.name.name,
    default: ACCOUNTS_CONTENT.name.default,
  },
]

export const selectAccountQuestions = (accounts: EntropyAccountConfig[]) => [{
  type: 'list',
  name: ACCOUNTS_CONTENT.selectAccount.name,
  message: ACCOUNTS_CONTENT.selectAccount.message,
  choices: generateAccountChoices(accounts)
}]

export const manageAccountsQuestions = [
  {
    type: 'list',
    name: ACCOUNTS_CONTENT.interactionChoice.name,
    pageSize: ACCOUNTS_CONTENT.interactionChoice.choices.length,
    choices: ACCOUNTS_CONTENT.interactionChoice.choices
  }
]

export async function createAccount ({ name, seed, path }: CreateAccountParams): Promise<EntropyAccountConfig> {
  const keyring = new Keyring({ seed, path, debug: true })
  const fullAccount = keyring.getAccount()
  // TO-DO: sdk should create account on constructor
  const { admin } = keyring.getAccount()
  
  const data = fullAccount
  delete admin.pair
  // const encryptedData = password ? passwordFlow.encrypt(data, password) : data

  return {
    name: name,
    address: admin.address,
    // TODO: replace with data: encryptedData once pasword input is added back
    data,
  }
}

function formatAccountsList (accounts: EntropyAccountConfig[]): ListedAccount[] {
  return accounts.map((account: EntropyAccountConfig) => ({
    name: account.name,
    address: account.address,
    verifyingKeys: account?.data?.admin?.verifyingKeys
  }))
}

export function listAccounts ({ accounts }: Partial<EntropyConfig>) {
  const accountsArray = Array.isArray(accounts) && accounts.length ? accounts : []
  if (!accountsArray.length)
    throw new Error(
      'There are currently no accounts available, please create or import your new account using the Manage Accounts feature'
    )
  return formatAccountsList(accountsArray)
}

export async function registerAccount (entropy: Entropy, params?: RegisterParams): Promise<string> {
  let verifyingKey: string
  try {
    const registerParams = params?.programModAddress && params?.programData ? { programDeployer: params.programModAddress, programData: params.programData } : undefined
    
    verifyingKey = await entropy.register(registerParams)
    return verifyingKey
  } catch (error) {
    if (!verifyingKey) {
      try {
        const tx = entropy.substrate.tx.registry.pruneRegistration()
        await tx.signAndSend(entropy.keyring.accounts.registration.pair, ({ status }) => {
          if (status.isFinalized) {
            print('Successfully pruned registration');
          }
        })
      } catch (error) {
        console.error('Unable to prune registration due to:', error.message);
        throw error
      }
    }
    throw error
  }
}