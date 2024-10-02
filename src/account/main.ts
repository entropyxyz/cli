import Entropy, { wasmGlobalsReady } from "@entropyxyz/sdk";
// @ts-expect-error
import Keyring from '@entropyxyz/sdk/keys'
import { randomAsHex } from '@polkadot/util-crypto'

import { FLOW_CONTEXT } from "./constants";
import { AccountCreateParams, AccountImportParams, AccountRegisterParams } from "./types";

import { EntropyBase } from "../common/entropy-base";
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
            let msg: string
            if (dispatchError.isModule) {
              // for module errors, we have the section indexed, lookup
              const decoded = this.entropy.substrate.registry.findMetaError(
                dispatchError.asModule
              )
              const { docs, name, section } = decoded

              msg = `${section}.${name}: ${docs.join(' ')}`
            } else {
              // Other, CannotLookup, BadOrigin, no extra info
              msg = dispatchError.toString()
            }
            const error = Error(msg)
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
  if (data.admin) {
    data.admin.pair.addressRaw = objToUint8Array(data.admin.pair.addressRaw)
    data.admin.pair.secretKey = objToUint8Array(data.admin.pair.secretKey)
    data.admin.pair.publicKey = objToUint8Array(data.admin.pair.publicKey)
  }

  if (data.registration) {
    data.registration.pair.addressRaw = objToUint8Array(data.registration.pair.addressRaw)
    data.registration.pair.secretKey = objToUint8Array(data.registration.pair.secretKey)
    data.registration.pair.publicKey = objToUint8Array(data.registration.pair.publicKey)
  }

  return data
}

function objToUint8Array (obj) {
  const values: any = Object.entries(obj)
    .sort((a, b) => Number(a[0]) - Number(b[0])) // sort entries by keys
    .map(entry => entry[1])

  return new Uint8Array(values)
}
