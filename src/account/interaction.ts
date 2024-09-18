import inquirer from "inquirer";
import Entropy from "@entropyxyz/sdk";

import { EntropyAccount } from './main'
import { selectAndPersistNewAccount } from "./utils";
import { findAccountByAddressOrName, print } from "../common/utils"
import { EntropyConfig } from "../config/types";
import * as config from "../config";

import { 
  manageAccountsQuestions,
  newAccountQuestions,
  selectAccountQuestions
} from "./utils"

/*
 * @returns partialConfigUpdate | "exit" | undefined
 */
export async function entropyAccount (endpoint: string, storedConfig: EntropyConfig) {
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

    const newAccount = seed
      ? await EntropyAccount.import({ seed, name, path })
      : await EntropyAccount.create({ name, path })

    await selectAndPersistNewAccount(newAccount)
    return
  }

  case 'select-account': {
    if (!accounts.length) {
      console.error('There are currently no accounts available, please create or import a new account using the Manage Accounts feature')
      return
    }
    const { selectedAccount } = await inquirer.prompt(selectAccountQuestions(accounts))
    await config.set({
      ...storedConfig,
      selectedAccount: selectedAccount.address
    })

    print('Current selected account is ' + selectedAccount)
    return
  }

  case 'list-account': {
    try {
      EntropyAccount.list({ accounts })
        .forEach((account) => print(account))
    } catch (error) {
      console.error(error.message.split('AccountsError: ')[1])
    }
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
  const accountService = new EntropyAccount(entropy, endpoint)

  const { accounts, selectedAccount } = storedConfig
  const currentAccount = findAccountByAddressOrName(accounts, selectedAccount)
  if (!currentAccount) {
    print("No account selected to register")
    return;
  }
  print("Attempting to register the address:", currentAccount.address)
  const updatedAccount = await accountService.registerAccount(currentAccount)
  const arrIdx = accounts.indexOf(currentAccount)
  accounts.splice(arrIdx, 1, updatedAccount)
  print("Your address", updatedAccount.address, "has been successfully registered.")

  return { accounts, selectedAccount }
}
