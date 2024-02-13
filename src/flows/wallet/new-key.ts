import inquirer from 'inquirer'
import { randomAsHex } from '@polkadot/util-crypto'
import { getWallet } from '@entropyxyz/sdk/dist/keys'
import { importQuestions } from './import-key'
import * as passwordFlow from '../password'

const questions = [
  {
    type: 'confirm',
    name: 'importKey',
    message: 'Would you like to import a key',
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
  },
  ...passwordFlow.questions,
]

export async function newKey ({ accounts }) {
  accounts = Array.isArray(accounts) ? accounts : []
  const { secret, secretType, name, path, password, importKey } = await inquirer.prompt(questions)

  const sameName = accounts.map((account) => account.name)

  let newName = name
  let index = 1

  while (sameName.includes(newName)) {
    newName = `${name} ${index}`
    index++
  }

  const seed = importKey ? secret : randomAsHex(32)
  const signer = await getWallet(seed)
  const address = signer.wallet.address

  const data = {
    type: secretType || 'seed',
    seed,
    path,
  }

  const encryptedData = password ? passwordFlow.encrypt(data, password) : data

  const newKey = {
    name: newName,
    address,
    data: encryptedData,
  }

  console.log(`New account:\n{\n\tname: ${newKey.name}\n\taddress: ${newKey.address}\n\ttype: ${data.type}\n}`)

  accounts.push(newKey)
  return accounts
}
