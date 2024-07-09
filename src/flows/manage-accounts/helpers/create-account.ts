// @ts-ignore
import Keyring from '@entropyxyz/sdk/keys'
import { debug } from 'src/common/utils';
import { EntropyAccountConfig } from "src/config/types";

export async function createAccount ({ name, seed, path }: { name: string, seed: string, path?: string }): Promise<EntropyAccountConfig> {
  const keyring = new Keyring({ seed, path, debug: true })
  const fullAccount = keyring.getAccount()
  // TO-DO: sdk should create account on constructor
  const { admin } = keyring.getAccount()
  debug('fullAccount:', fullAccount)
  
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