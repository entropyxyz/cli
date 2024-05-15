import inquirer from 'inquirer'
import { randomAsHex } from '@polkadot/util-crypto'
import { getWallet } from '@entropyxyz/sdk/keys'
import { importQuestions } from './import-key'
import * as passwordFlow from '../password'

export async function newKey ({ accounts }) {
  accounts = Array.isArray(accounts) ? accounts : []

  const questions = [
    {
      type: 'confirm',
      name: 'importKey',
      message: 'Would you like to import a key?',
      default: false,
    },
    ...importQuestions,
    {
      type: 'input',
      name: 'name',
      default: 'My Key'
    },
    {
      type: 'confirm',
      name: 'newPassword',
      message: 'Would you like to password protect this key?',
      default: true,
    }
  ]

  let answers = await inquirer.prompt(questions)

  if (answers.newPassword) {
    const passwordAnswer = await inquirer.prompt([
      {
        type: 'password',
        name: 'password',
        mask: '*',
        message: 'Enter a password for the key:',
      }
    ])
    answers = { ...answers, ...passwordAnswer }
  }

  if (passwordFlow.questions.length > 0) {
    const passwordFlowAnswers = await inquirer.prompt(passwordFlow.questions)
    answers = { ...answers, ...passwordFlowAnswers }
  }

  const { secret, secretType, name, path, password, importKey } = answers

  const seed = importKey ? secret : randomAsHex(32)
  const signer = await getWallet(seed)
  const address = signer.wallet.address

  const data = {
    type: secretType || 'seed',
    seed,
    path,
  }

  const encryptedData = password ? passwordFlow.encrypt(data, password) : data

  const newAccount = {
    name: name,
    address,
    data: encryptedData,
  }

  console.log(`New account:\n{\n\tname: ${newAccount.name}\n\taddress: ${newAccount.address}\n\ttype: ${data.type}\n}`)

  accounts.push(newAccount)
  return accounts
}
