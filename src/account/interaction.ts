import inquirer from "inquirer";
import Entropy from "@entropyxyz/sdk";

import { getSelectedAccount, print } from "../common/utils"
import { EntropyAccountConfig, EntropyConfig } from "../config/types";
import { EntropyAccount } from './main'

import { 
  manageAccountsQuestions,
  newAccountQuestions,
  selectAccountQuestions
} from "./utils"


export async function entropyManageAccounts (endpoint: string, storedConfig: EntropyConfig) {
  const AccountService = new EntropyAccount({ endpoint })
  const { accounts } = storedConfig
  const { interactionChoice } = await inquirer.prompt(manageAccountsQuestions)
  switch (interactionChoice) {
  case 'create-import': {
    const answers = await inquirer.prompt(newAccountQuestions)
    const { name, path, importKey } = answers
    let { seed } = answers
    if (importKey && seed.includes('#debug')) {
      // isDebugMode = true
      seed = seed.split('#debug')[0]
    }
    const newAccount = await AccountService.create({ seed, name, path })
    accounts.push(newAccount) 
    return {
      accounts,
      selectedAccount: newAccount.address
    }
  }
  case 'select-account': {
    const { selectedAccount } = await inquirer.prompt(selectAccountQuestions(accounts))
  
    print('Current selected account is ' + selectedAccount)
    return {
      accounts: storedConfig.accounts,
      selectedAccount: selectedAccount.address
    }
  }
  case 'list-account': {
    const list = this.list(accounts)
    list?.forEach((account: EntropyAccountConfig)=> print(account))
    return
  }
  case 'exit': {
    return 'exit'
  }
  default:
    throw new Error('AccountsError: Unknown interaction action')
  }
}

export async function entropyRegister (entropy: Entropy, endpoint: string, storedConfig: EntropyConfig): Promise<Partial<EntropyConfig>> {
  const AccountService = new EntropyAccount({ entropy, endpoint })

  const { accounts, selectedAccount } = storedConfig
  const currentAccount = getSelectedAccount(accounts, selectedAccount)
  if (!currentAccount) {
    print("No account selected to register")
    return;
  }
  print("Attempting to register the address:", currentAccount.address)
  const updatedAccount = await AccountService.registerAccount(currentAccount)
  const arrIdx = accounts.indexOf(currentAccount)
  accounts.splice(arrIdx, 1, updatedAccount)
  print("Your address", updatedAccount.address, "has been successfully registered.")

  return { accounts, selectedAccount }
}
