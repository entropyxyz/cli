import inquirer from "inquirer";
import Entropy from "@entropyxyz/sdk";
import { randomAsHex } from '@polkadot/util-crypto'
import { BaseCommand } from "../common/base-command";
import { print, updateConfig } from "../common/utils";
import { EntropyAccountConfig, EntropyConfig } from "../config/types";
import { FLOW_CONTEXT } from "./constants";
import { 
  createAccount,
  listAccounts,
  manageAccountsQuestions,
  newAccountQuestions,
  registerAccount,
  selectAccountQuestions
} from "./utils";
import { CreateAccountParams } from "./types";

export class AccountsCommand extends BaseCommand {
  constructor (entropy: Entropy, endpoint: string) {
    super(entropy, endpoint, FLOW_CONTEXT)
  }

  public async newAccount (params?: CreateAccountParams): Promise<EntropyAccountConfig> {
    let { seed, name, path } = params
    let importKey: boolean

    if (!seed && !name && !path) {
      ({ seed, name, path, importKey } = await inquirer.prompt(newAccountQuestions))
    }

    if (importKey && seed.includes('#debug')) {
      seed = seed.split('#debug')[0]
    }

    return createAccount({ name, seed, path })
  }

  public async updateConfig (storedConfig: EntropyConfig, newAccount: EntropyAccountConfig): Promise<any> {
    const { accounts } = storedConfig
    accounts.push(newAccount)
    
    return updateConfig(storedConfig, { accounts, selectedAccount: newAccount.address })
  }

  public async selectAccount (accounts: EntropyAccountConfig[]) {
    const answers = await inquirer.prompt(selectAccountQuestions(accounts))
  
    return { selectedAccount: answers.selectedAccount.address }
  }

  public listAccounts (accounts: EntropyAccountConfig[]) {
    return listAccounts({ accounts })
  }

  public async getUserInput (): Promise<CreateAccountParams> {
    const answers = await inquirer.prompt(newAccountQuestions)
    const { secret, name, path, importKey } = answers
    let seed: string
  
    // never create debug keys only ever import them
    if (importKey && secret.includes('#debug')) {
      // isDebugMode = true
      seed = secret.split('#debug')[0]
    } else {
      seed = importKey ? secret : randomAsHex(32)
    }
  
    return { seed, name, path }
  }

  public async registerAccount (account: EntropyAccountConfig): Promise<EntropyAccountConfig> {
    this.logger.debug(
      'about to register selectedAccount.address' + 
      account.address + 'keyring:' +
      // @ts-expect-error Type export of ChildKey still not available from SDK
      this.entropy.keyring.getLazyLoadAccountProxy('registration').pair.address,
      'REGISTER'
    )

    try {
      const verifyingKey = await registerAccount(this.entropy)
      
      account?.data?.registration?.verifyingKeys?.push(verifyingKey)
      return account
    } catch (error) {
      this.logger.error('There was a problem registering', error)
      throw error
    }
  }

  public async runInteraction (config): Promise<any> {
    const { accounts } = config
    const { interactionChoice } = await inquirer.prompt(manageAccountsQuestions)
    
    switch (interactionChoice) {
    case 'create-account': {
      const createAccountParams = await this.getUserInput()
      const newAccount = await this.newAccount(createAccountParams)
      print('New Account:')
      print({ name: newAccount.name, address: newAccount.address })
      accounts.push(newAccount)
      return { accounts, selectedAccount: newAccount.address }
    }
    case 'select-account': {
      const response = await this.selectAccount(config.accounts)
      print('Current selected account is ' + response.selectedAccount)
      return response
    }
    case 'list-account': {
      const list = this.listAccounts(accounts)
      list?.forEach(account => print(account))
      return
    }
    case 'exit': {
      return 'exit'
    }
    default:
      throw new Error('AccountsError: Unknown interaction action')
    }
  }
}