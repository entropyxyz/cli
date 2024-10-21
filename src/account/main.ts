import Entropy, { wasmGlobalsReady } from "@entropyxyz/sdk";
// @ts-expect-error
import Keyring from '@entropyxyz/sdk/keys'
import { randomAsHex } from '@polkadot/util-crypto'

import { FLOW_CONTEXT } from "./constants";
import { AccountCreateParams, AccountImportParams, AccountRegisterParams } from "./types";

import { EntropyBase } from "../common/entropy-base";
import { EntropyAccountConfig } from "../config/types";

export class EntropyAccount extends EntropyBase {
  constructor (entropy: Entropy, endpoint: string) {
    super({ entropy, endpoint, flowContext: FLOW_CONTEXT })
  }

  static async create ({ name, path }: AccountCreateParams): Promise<EntropyAccountConfig> {
    const seed = randomAsHex(32)
    return EntropyAccount.import({ name, seed, path })
  }

  static async import ({ name, seed, path }: AccountImportParams ): Promise<EntropyAccountConfig> {
    // WARNING: #create currently depends on this => be careful modifying this function

    await wasmGlobalsReady()
    const keyring = new Keyring({ seed, path, debug: true })
    const fullAccount = keyring.getAccount()
    // TODO: sdk should create account on constructor
    const { admin } = keyring.getAccount()

    const data = fullAccount
    delete admin.pair
    
    return {
      name,
      address: admin.address,
      data
    }
  }

  static list ({ accounts }: { accounts: EntropyAccountConfig[] }) {
    if (!accounts.length)
      throw new Error(
        'AccountsError: There are currently no accounts available, please create or import a new account using the Manage Accounts feature'
      )

    return accounts.map((account: EntropyAccountConfig) => ({
      name: account.name,
      address: account.address,
      verifyingKeys: account?.data?.admin?.verifyingKeys
    }))
  }

  async register (params?: AccountRegisterParams): Promise<string> {
    let programModAddress: string
    let programData: any
    if (params) {
      ({ programModAddress, programData } = params)
    }
    const registerParams = programModAddress && programData
      ? {
        programDeployer: programModAddress,
        programData
      }
      : undefined

    this.logger.debug(`registering with params: ${registerParams}`, 'REGISTER')
    return this.entropy.register(registerParams)
  }
}
