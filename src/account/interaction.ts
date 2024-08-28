import inquirer from "inquirer";
import { EntropyAccount } from './main'
import { print } from "src/common/utils"

import { 
  manageAccountsQuestions,
  newAccountQuestions,
  registerAccount,
  selectAccountQuestions
} from "./utils";


export async function entropyAccountCreate (entropy, endpoint) {
  const { name, path } = await inquirer.prompt(newAccountQuestions)

  const service = new EntropyAccount(entropy, endpoint)
  const account = await service.create({ name, path })

  print(({
    name: account.name,
    address: account.address
  }))
}

export async function entropyAccountCreate (entropy, endpoint) {
  const { name, path } = await inquirer.prompt(newAccountQuestions)

  const service = new EntropyAccount(entropy, endpoint)
  const account = await service.create({ name, path })

  print(({
    name: account.name,
    address: account.address
  }))
}
