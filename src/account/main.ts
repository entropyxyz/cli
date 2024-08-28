import Entropy from "@entropyxyz/sdk";
// @ts-expect-error
import Keyring from '@entropyxyz/sdk/keys'
import { randomAsHex } from '@polkadot/util-crypto'

import { EntropyBase } from "../common/entropy-base";
import { print, updateConfig } from "../common/utils";
import { EntropyAccountConfig, EntropyConfig } from "../config/types";
import { FLOW_CONTEXT } from "./constants";
import { AccountCreateParams, AccountListResults } from "./types";

export class EntropyAccount extends EntropyBase {
  // NOTE: this class is different - it doesn't need an entropy instance
  constructor (entropy: Entropy | null, endpoint: string) {
    super(entropy, endpoint, FLOW_CONTEXT)
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
        'Accounts Error: There are currently no accounts available, please create or import a new account'
      )
    return formatAccountsList(accountsArray)
  }

  // WIP: Extract all these things into => interaction.ts

  // public async newAccount (params?: AccountCreateParams): Promise<EntropyAccountConfig> {
  //   let { seed, name, path } = params
  //   let importKey: boolean

  //   if (!seed && !name && !path) {
  //   }

  //   if (importKey && seed.includes('#debug')) {
  //     seed = seed.split('#debug')[0]
  //   }

  // }

  // public async updateConfig (storedConfig: EntropyConfig, newAccount: EntropyAccountConfig): Promise<any> {
  //   const { accounts } = storedConfig
  //   accounts.push(newAccount)
  //   
  //   return updateConfig(storedConfig, { accounts, selectedAccount: newAccount.address })
  // }

  // public async selectAccount (accounts: EntropyAccountConfig[]) {
  //   const answers = await inquirer.prompt(selectAccountQuestions(accounts))
  // 
  //   return { selectedAccount: answers.selectedAccount.address }
  // }

  // public async getUserInput (): Promise<AccountCreateParams> {
  //   const answers = await inquirer.prompt(newAccountQuestions)
  //   const { secret, name, path, importKey } = answers
  //   let seed: string
  // 
  //   // never create debug keys only ever import them
  //   if (importKey && secret.includes('#debug')) {
  //     // isDebugMode = true
  //     seed = secret.split('#debug')[0]
  //   } else {
  //     seed = importKey ? secret : randomAsHex(32)
  //   }
  // 
  //   return { seed, name, path }
  // }

  // public async registerAccount (account: EntropyAccountConfig): Promise<EntropyAccountConfig> {
  //   this.logger.debug(
  //     'about to register selectedAccount.address' + 
  //     account.address + 'keyring:' +
  //     // @ts-expect-error Type export of ChildKey still not available from SDK
  //     this.entropy.keyring.getLazyLoadAccountProxy('registration').pair.address,
  //     'REGISTER'
  //   )

  //   try {
  //     const verifyingKey = await registerAccount(this.entropy)
  //     
  //     account?.data?.registration?.verifyingKeys?.push(verifyingKey)
  //     return account
  //   } catch (error) {
  //     this.logger.error('There was a problem registering', error)
  //     throw error
  //   }
  // }

  // public async runInteraction (config): Promise<any> {
  //   const { accounts } = config
  //   const { interactionChoice } = await inquirer.prompt(manageAccountsQuestions)
  //   
  //   switch (interactionChoice) {
  //   case 'create-account': {
  //     const createAccountParams = await this.getUserInput()
  //     const newAccount = await this.newAccount(createAccountParams)
  //     print('New Account:')
  //     print({ name: newAccount.name, address: newAccount.address })
  //     accounts.push(newAccount)
  //     return { accounts, selectedAccount: newAccount.address }
  //   }
  //   case 'select-account': {
  //     const response = await this.selectAccount(config.accounts)
  //     print('Current selected account is ' + response.selectedAccount)
  //     return response
  //   }
  //   case 'list-account': {
  //     const list = this.list(accounts)
  //     list?.forEach(account => print(account))
  //     return
  //   }
  //   case 'exit': {
  //     return 'exit'
  //   }
  //   default:
  //     throw new Error('AccountsError: Unknown interaction action')
  //   }
  // }
}

function formatAccountsList (accounts: EntropyAccountConfig[]): AccountListResults[] {
  return accounts.map((account: EntropyAccountConfig) => ({
    name: account.name,
    address: account.address,
    verifyingKeys: account?.data?.admin?.verifyingKeys
  }))
}
