import Entropy from "@entropyxyz/sdk";
// @ts-expect-error
import Keyring from '@entropyxyz/sdk/keys'
import { randomAsHex } from '@polkadot/util-crypto'

import { EntropyBase } from "../common/entropy-base";
import { EntropyAccountConfig } from "../config/types";

import { FLOW_CONTEXT } from "./constants";
import { AccountCreateParams, AccountRegisterParams } from "./types";
import { print } from "src/common/utils";
import { formatAccountsList } from "./utils";

export class EntropyAccount extends EntropyBase {
  // Entropy does not need to be required, as only register needs it
  // Idea: We could use entropy as an argument for the register method,
  // the base class has been updated to optionally require entropy in the
  // constructor.
  constructor ({ entropy, endpoint }: { entropy?: Entropy, endpoint: string }) {
    super({ entropy, endpoint, flowContext: FLOW_CONTEXT })
  }

  async create ({ seed = randomAsHex(32), name, path }: AccountCreateParams): Promise<EntropyAccountConfig> {
    const keyring = new Keyring({ seed, path, debug: true })
    const fullAccount = keyring.getAccount()
    // TODO: sdk should create account on constructor
    const { admin } = keyring.getAccount()

    const data = fullAccount
    delete admin.pair
    // const encryptedData = password ? passwordFlow.encrypt(data, password) : data

    return {
      name: name,
      address: admin.address,
      data
      // data: encryptedData // TODO: replace once password input is added back
    }
  }

  list ({ accounts }: { accounts: EntropyAccountConfig[] }) {
    const accountsArray = Array.isArray(accounts) && accounts.length
      ? accounts
      : []
    if (!accountsArray.length)
      throw new Error(
        'AccountsError: There are currently no accounts available, please create or import a new account using the Manage Accounts feature'
      )
    return formatAccountsList(accountsArray)
  }

  private async register (params?: AccountRegisterParams): Promise<string> {
    const { programModAddress, programData } = params
    let verifyingKey: string
    try {
      const registerParams = programModAddress && programData ? { programDeployer: programModAddress, programData } : undefined
      
      verifyingKey = await this.entropy.register(registerParams)
      return verifyingKey
    } catch (error) {
      if (!verifyingKey) {
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
      throw error
    }
  }

  async registerAccount (account: EntropyAccountConfig, registerParams?: AccountRegisterParams): Promise<EntropyAccountConfig> {
    this.logger.debug(
      'about to register selectedAccount.address' + 
      account.address + 'keyring:' +
      // @ts-expect-error Type export of ChildKey still not available from SDK
      this.entropy.keyring.getLazyLoadAccountProxy('registration').pair.address,
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
}
