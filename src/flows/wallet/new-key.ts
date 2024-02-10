import inquirer from 'inquirer'
import { randomAsHex } from '@polkadot/util-crypto'
import { Controller } from '../../../controller'
import { getWallet } from '@entropyxyz/sdk/dist/keys'
import Entropy, { EntropyAccount } from '@entropyxyz/sdk'
import { handleChainEndpoint } from '../../common/questions'
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

  const { secret, secretType, name, path, password, importKey } = await inquirer.prompt(questions)
  const names = accounts.map((account) => account.name)

  const sameNames = names.reduce((agg, accountName) => {
    if (
      // check if same name exists
      accountName === name ||
      // check if multiple indexed names exist
      accountName.startsWith(name) &&
      // make sure if it doese start with that same that the next is the number
      // example: My Name 1 -> true My Name awesome -> false
      accountName.split(' ').length + 1 === name.split(' ').length &&
      /^\d+$/.test(accountName.split(' ')[(accountName.split(' ').length - 1)])
    ) {
      agg.push(accountName)
    }
    return agg
  }, [])

  const seed = importKey ? secret : randomAsHex(32)
  const signer = await getWallet(seed)
  const address = signer.wallet.address

  const data = {
    type: secretType || 'seed',
    seed,
    path,
  }

  const newKey = {
    name: `${name}${ sameNames.length ? ` ${sameNames.length + 1}` : ''}`,
    address,
    data: password ? passwordFlow.encrypt(data, password) : data,
  }

  console.log(`New account: \n{\n\tname: ${newKey.name} \n\taddress: ${newKey.address} \n\ttype: ${newKey.type}\n}`)
  accounts.push(newKey)
  return accounts
}
