import Entropy, { wasmGlobalsReady } from "@entropyxyz/sdk";
// @ts-expect-error
import Keyring from '@entropyxyz/sdk/keys'
import { randomAsHex } from '@polkadot/util-crypto'

import { FLOW_CONTEXT } from "./constants";
import { AccountCreateParams, AccountImportParams, AccountRegisterParams } from "./types";

import { EntropyBase } from "../common/entropy-base";
import { formatDispatchError } from "../common/utils";
import { EntropyAccountConfig, EntropyAccountConfigFormatted } from "../config/types";

export class EntropyAccount extends EntropyBase {
  constructor (entropy: Entropy, endpoint: string) {
    super({ entropy, endpoint, flowContext: FLOW_CONTEXT })
  }

  static async create ({ name, path }: AccountCreateParams): Promise<EntropyAccountConfig> {
    const seed = randomAsHex(32)
    return EntropyAccount.import({ name, seed, path })
  }

  // WARNING: #create depends on #import => be careful modifying this function
  static async import ({ name, seed, path }: AccountImportParams ): Promise<EntropyAccountConfig> {
    await wasmGlobalsReady()
    const keyring = new Keyring({ seed, path, debug: true })

    const fullAccount = keyring.getAccount()
    // TODO: sdk should create account on constructor
    const data = fixData(fullAccount)
    const maybeEncryptedData = data
    // const maybeEncryptedData = password ? passwordFlow.encrypt(data, password) : data

    const { admin } = keyring.getAccount()
    delete admin.pair

    return {
      name,
      address: admin.address,
      data: maybeEncryptedData,
    }
  }

  static list ({ accounts }: { accounts: EntropyAccountConfig[] }): EntropyAccountConfigFormatted[] {
    if (!accounts.length)
      throw new Error(
        'AccountsError: There are currently no accounts available, please create or import a new account using the Manage Accounts feature'
      )

    return accounts.map((account: EntropyAccountConfig) => ({
      name: account.name,
      address: account.address,
      verifyingKeys: account?.data?.registration?.verifyingKeys || []
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
      // NOTE: if "register" fails for any reason, core currently leaves the chain in a "polluted"
      // state. To fix this we manually "prune" the dirty registration transaction.
      .catch(async error => {
        await this.pruneRegistration()
        throw error
      })
  }

  /* PRIVATE */

  private async pruneRegistration () {
    return new Promise((resolve, reject) => {
      this.entropy.substrate.tx.registry.pruneRegistration()
        .signAndSend(this.entropy.keyring.accounts.registration.pair, ({ status, dispatchError }) => {
          if (dispatchError) {
            const error = formatDispatchError(this.entropy, dispatchError)
            this.logger.error('There was an issue pruning registration', error)
            return reject(error)
          }
          if (status.isFinalized) {
            resolve(status)
          }
        })
    })
  }
}

// TODO: there is a bug in SDK that is munting this data
function fixData (data) {
  if (data.admin?.pair) {
    const { addressRaw, secretKey, publicKey } = data.admin.pair
    Object.assign(data.admin.pair, {
      addressRaw: objToUint8Array(addressRaw),
      secretKey: objToUint8Array(secretKey),
      publicKey: objToUint8Array(publicKey)
    })
  }

  if (data.registration?.pair) {
    const { addressRaw, secretKey, publicKey } = data.registration.pair
    Object.assign(data.registration.pair, {
      addressRaw: objToUint8Array(addressRaw),
      secretKey: objToUint8Array(secretKey),
      publicKey: objToUint8Array(publicKey)
    })
  }

  return data
}

function objToUint8Array (input) {
  if (input instanceof Uint8Array) return input

  const values: any = Object.entries(input)
    .sort((a, b) => Number(a[0]) - Number(b[0])) // sort entries by keys
    .map(entry => entry[1])

  return new Uint8Array(values)
}
