import { mnemonicValidate, mnemonicToMiniSecret } from '@polkadot/util-crypto'

const questions = [
  {
    type: 'list',
    name: 'secretType',
    message: 'select secret type:',
    choices: ['mnemonic', 'seed'],
    when: ({ importKey }) => importKey
  },
  {
    type: 'input',
    name: 'secret',
    message: ({ secretType }) => { return`${secretType}` },
    validate: (secret, {secretType}) => {
      if (secretType === 'mnemonic') return mnemonicValidate(secret) ? true : 'not a valid mnemonic'
      if (secret.length === 66 && secret.startsWinth('0x')) return true
      if (secret.length === 64) return true
      return 'not a valid seed'
    },
    filter: (secret, { secretType }) => {
      if (secretType === 'mnemonic') {
        return mnemonicToMiniSecret(secret)
      }
    },
    when: ({ importKey }) => importKey
  },
  {
    type: 'input',
    name: 'path',
    meesage: 'derivation path:',
    default: 'none',
    when: ({ importKey }) => importKey
  },
]

export async function importKey () {

}