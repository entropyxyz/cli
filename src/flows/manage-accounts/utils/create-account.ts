// @ts-ignore
import Keyring from '@entropyxyz/sdk/keys'
import { EntropyLogger } from 'src/common/logger';
import { EntropyAccountConfig } from "src/config/types";

export async function createAccount ({ name, seed, path }: { name: string, seed: string, path?: string }, logger?: EntropyLogger): Promise<EntropyAccountConfig> {
  const FLOW_CONTEXT = 'MANAGE_ACCOUNTS::CREATE_ACCOUNT'
  const keyring = new Keyring({ seed, path, debug: true })
  const fullAccount = keyring.getAccount()
  // TO-DO: sdk should create account on constructor
  const { admin } = keyring.getAccount()
  logger?.debug('fullAccount:', FLOW_CONTEXT)
  logger?.debug(fullAccount, FLOW_CONTEXT)
  
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