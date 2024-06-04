import inquirer from 'inquirer'
import { randomAsHex } from '@polkadot/util-crypto'
// @ts-ignore
import Keyring from '@entropyxyz/sdk/keys'
import { importQuestions } from './import-key'
// import * as passwordFlow from '../password'
import { debug, print } from '../../common/utils'

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
    // {
    //   type: 'confirm',
    //   name: 'newPassword',
    //   message: 'Would you like to password protect this key?',
    //   default: true,
    // }
  ]

  const answers = await inquirer.prompt(questions)

  // if (answers.newPassword) {
  //   const passwordAnswer = await inquirer.prompt([
  //     {
  //       type: 'password',
  //       name: 'password',
  //       mask: '*',
  //       message: 'Enter a password for the key:',
  //     }
  //   ])
  //   answers = { ...answers, ...passwordAnswer }
  // }
  // The below conditional resolves as true, but the passwordFlow questions never get asked
  // most likely due to the when field criteria not being satified on the individual questions
  // if (passwordFlow.questions.length > 0) {
  //   const passwordFlowAnswers = await inquirer.prompt(passwordFlow.questions)
  //   answers = { ...answers, ...passwordFlowAnswers }
  // }

  // const { secret, name, path, password, importKey } = answers
  const { secret, name, path, importKey } = answers
  // let isDebugMode = false
  let seed
  // never create debug keys only ever import them
  if (importKey && secret.includes('#debug')) {
    // isDebugMode = true
    seed = secret.split('#debug')[0]
  } else {
    seed = importKey ? secret : randomAsHex(32)
  }

  const keyring = new Keyring({ seed, path, debug: true })
  const fullAccount = keyring.getAccount()
  // TO-DO: sdk should create account on constructor
  const { admin } = keyring.getAccount()
  debug('fullAccount:', fullAccount)
  
  const data = fullAccount
  delete admin.pair
  // const encryptedData = password ? passwordFlow.encrypt(data, password) : data

  const newAccount = {
    name: name,
    address: admin.address,
    // TODO: replace with data: encryptedData once pasword input is added back
    data,
  }

  print(`New account:\n{\n\tname: ${newAccount.name}\n\taddress: ${newAccount.address}\n}`)

  accounts.push(newAccount)
  return { accounts, selectedAccount: newAccount.address }
}
