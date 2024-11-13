import inquirer from "inquirer";
import Entropy from "@entropyxyz/sdk";

import { EntropyAccount } from './main'
import { selectAndPersistNewAccount, addVerifyingKeyToAccountAndSelect, completeImport } from "./utils";
import { findAccountByAddressOrName, print } from "../common/utils"
import { EntropyAccountConfig, EntropyConfig } from "../config/types";
import * as config from "../config";

import { 
  accountManageQuestions,
  accountNewQuestions,
  accountSelectQuestions
} from "./utils"
import { ERROR_RED } from "src/common/constants";

/*
 * @returns partialConfigUpdate | "exit" | undefined
 */
export async function entropyAccount (storedConfig: EntropyConfig, endpoint?: string) {
  const { accounts } = storedConfig
  const { interactionChoice } = await inquirer.prompt(accountManageQuestions)

  switch (interactionChoice) {

  case 'create-import': {
    const answers = await inquirer.prompt(accountNewQuestions)
    const { name, path, importKey } = answers
    let { seed } = answers
    if (importKey && seed.includes('#debug')) {
      // isDebugMode = true
      seed = seed.split('#debug')[0]
    }

    let newAccount: EntropyAccountConfig
    if (seed) {
      const partiallyImportedAccount = await EntropyAccount.import({ seed, name, path })
      newAccount = await completeImport(partiallyImportedAccount, endpoint)
    } else {
      newAccount = await EntropyAccount.create({ name, path })
    }

    await selectAndPersistNewAccount(newAccount)
    return
  }

  case 'select-account': {
    if (!accounts.length) {
      console.error('There are currently no accounts available, please create or import a new account using the Manage Accounts feature')
      return
    }
    const { selectedAccount } = await inquirer.prompt(accountSelectQuestions(accounts))
    
    await config.setSelectedAccount(selectedAccount)

    print('Current selected account is:')
    print({ name: selectedAccount.name, address: selectedAccount.address })
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
  const account = findAccountByAddressOrName(accounts, selectedAccount)
  if (!account) {
    print("No account selected to register")
    return
  }

  print("Attempting to register the address:", account.address)
  try {
    const verifyingKey = await accountService.register()
    await addVerifyingKeyToAccountAndSelect(verifyingKey, account.address)
    const fullAccount = await entropy.keyring.getAccount()
    const newverifyingkeys = await accountService.getVerifyingKeys(fullAccount.registration.address)
    
    console.log({ regkeys: fullAccount.registration.verifyingKeys, devkeys: fullAccount.deviceKey.verifyingKeys, adminkeys: fullAccount.admin.verifyingKeys });
    console.log({ newverifyingkeys })

    print("Your address", account.address, "has been successfully registered.")
  } catch (error) {
    const endpointErrorMessageToMatch = 'Extrinsic registry.register expects 3 arguments, got 2'
    // const insufficientFeesErrorMessageToMatch = ''
    if (error.message.includes(endpointErrorMessageToMatch)) {
      console.error(ERROR_RED + 'GenericError: Incompatible endpoint, expected core version 0.3.0, got 0.2.0')
      return
    }
    console.error(ERROR_RED + 'Register Error:', error.message);
  }
}
