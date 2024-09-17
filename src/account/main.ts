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
    // const encryptedData = password ? passwordFlow.encrypt(data, password) : data
    
    return {
      name,
      address: admin.address,
      data
      // data: encryptedData // TODO: replace once password input is added back
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

    return this.entropy.register(registerParams)
      .catch(async error => {
        await this.pruneRegistration()
        throw error
      })
  }

  // WATCH: should this be extracted to interaction.ts?
  async registerAccount (account: EntropyAccountConfig, registerParams?: AccountRegisterParams): Promise<EntropyAccountConfig> {
    this.logger.debug(
      [
        `registering account: ${account.address}`,
        // @ts-expect-error Type export of ChildKey still not available from SDK
        `to keyring: ${this.entropy.keyring.getLazyLoadAccountProxy('registration').pair.address}`
      ].join(', '),
      'REGISTER'
    )
    // Register params to be defined from user input (arguments/options or inquirer prompts)
    try {
      const verifyingKey = await this.register(registerParams)

      account?.data?.registration?.verifyingKeys?.push(verifyingKey)
      return account
    } catch (error) {
      this.logger.error('There was a problem registering', error)
      throw error
    }
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
