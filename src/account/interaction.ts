import inquirer from "inquirer";
import { EntropyAccount } from './main'
import { print } from "src/common/utils"
import * as config from '../config'

import { 
  manageAccountsQuestions,
  newAccountQuestions,
  registerAccount,
  selectAccountQuestions
} from "./utils";
import Entropy from "@entropyxyz/sdk";
import { EntropyConfig } from "src/config/types";

export async function entropyManageAccounts (entropy: Entropy, endpoint: string, storedConfig: EntropyConfig) {
  const AccountService = new EntropyAccount(entropy, endpoint)
  const { interactionChoice } = await inquirer.prompt(manageAccountsQuestions)
  switch (interactionChoice) {
    case 'create-import': {
      let { seed, name, path, importKey } = await inquirer.prompt(newAccountQuestions)
      if (importKey && seed.includes('#debug')) {
        // isDebugMode = true
        seed = seed.split('#debug')[0]
      }
      const newAccount = await AccountService.create({ seed, name, path })
    }
    case 'list-account': {

    }
    case 'select-account': {

    }
    case 'exit': {

    }
  }
  return { accounts: responses.accounts ? responses.accounts : storedConfig.accounts, selectedAccount: responses.selectedAccount || storedConfig.selectedAccount }
}
