import Entropy from "@entropyxyz/sdk";
// @ts-expect-error
import Keyring from '@entropyxyz/sdk/keys'
import { randomAsHex } from '@polkadot/util-crypto'

import { FLOW_CONTEXT } from "./constants";
import { AccountCreateParams, AccountImportParams, AccountRegisterParams } from "./types";
import { print } from "src/common/utils";
import { formatAccountsList } from "./utils";

import { EntropyBase } from "../common/entropy-base";
import { EntropyAccountConfig } from "../config/types";

export class EntropyAccount extends EntropyBase {
  constructor (entropy: Entropy, endpoint: string) {
    super({ entropy, endpoint, flowContext: FLOW_CONTEXT })
  }

  static create ({ name, path }: AccountCreateParams): EntropyAccountConfig {
    const seed = randomAsHex(32)
    return EntropyAccount.import({ name, seed, path })
  }

  static import ({ name, seed, path }: AccountImportParams ): EntropyAccountConfig {
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

  static list (accounts: EntropyAccountConfig[]) {
    const accountsArray = Array.isArray(accounts) && accounts.length
      ? accounts
      : []
    if (!accountsArray.length)
      throw new Error(
        'AccountsError: There are currently no accounts available, please create or import a new account using the Manage Accounts feature'
      )
    return formatAccountsList(accountsArray)
  }

  async register (params?: AccountRegisterParams): Promise<string> {
    const { programModAddress, programData } = params
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
    try {
      const tx = this.entropy.substrate.tx.registry.pruneRegistration()
      await tx.signAndSend(this.entropy.keyring.accounts.registration.pair, ({ status }) => {
        if (status.isFinalized) {
          print('Successfully pruned registration');
        }
      })
    } catch (error) {
      console.error('Unable to prune registration due to:', error.message);
      throw error
    }
  }
}
