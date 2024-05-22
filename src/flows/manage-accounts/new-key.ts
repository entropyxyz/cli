import inquirer from 'inquirer'
import { randomAsHex } from '@polkadot/util-crypto'
// @ts-ignore
import Keyring from '@entropyxyz/sdk/keys'
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

  const { secret, name, path, password, importKey } = answers
  let debug = false
  let seed
  // never create debug keys only ever import them
  if (importKey && secret.includes('#debug')) {
    debug = true
    seed = secret.split('#debug')[0]
  } else {
    seed = importKey ? secret : randomAsHex(32)
  }


  const keyring = new Keyring({ seed, path, debug })
  const fullAccount = keyring.getAccount()
  // const { admin } = keyring.getAccount()
  console.log('fullAccount:', fullAccount)
  
  const data = fullAccount
  delete fullAccount.admin.pair
  const encryptedData = password ? passwordFlow.encrypt(data, password) : data

  const newAccount = {
    name: name,
    address: fullAccount.admin.address,
    data: encryptedData,
  }

  console.log(`New account:\n{\n\tname: ${newAccount.name}\n\taddress: ${newAccount.address}\n}`)

  accounts.push(newAccount)
  return { accounts, selectedAccount: newAccount.address }
}
