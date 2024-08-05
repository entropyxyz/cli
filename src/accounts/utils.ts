// @ts-expect-error
import Keyring from '@entropyxyz/sdk/keys'
import { EntropyAccountConfig } from "src/config/types";
import { CreateAccountParams } from './types';
import { IMPORT_CONTENT } from './constants';

const validateSeedInput = (seed) => {
  if (seed.includes('#debug')) return true
  if (seed.length === 66 && seed.startsWith('0x')) return true
  if (seed.length === 64) return true
  return IMPORT_CONTENT.seed.invalidSeed
}

export const importQuestions = [
  {
    type: 'input',
    name: IMPORT_CONTENT.seed.name,
    message: IMPORT_CONTENT.seed.message,
    validate: validateSeedInput,
    when: ({ importKey }) => importKey
  },
  {
    type: 'input',
    name: IMPORT_CONTENT.path.name,
    message: IMPORT_CONTENT.path.message,
    default: IMPORT_CONTENT.path.default,
    when: ({ importKey }) => importKey
  },
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