import { debug } from '../../common/utils'
// import { mnemonicValidate, mnemonicToMiniSecret } from '@polkadot/util-crypto'

export const importQuestions = [
  {
    type: 'list',
    name: 'secretType',
    message: 'select secret type:',
    choices: ['seed'],
    when: ({ importKey }) => importKey
  },
  {
    type: 'input',
    name: 'secret',
    message: ({ secretType }) => `${secretType}:`,
    validate: (secret) => {
    // validate: (secret, { secretType }) => {
      debug('\nsecret:', secret, typeof secret)
      // if (secretType === 'mnemonic') return mnemonicValidate(secret) ? true : 'not a valid mnemonic'
      if (secret.includes('#debug')) return true
      if (secret.length === 66 && secret.startsWith('0x')) return true
      if (secret.length === 64) return true
      return 'not a valid seed'
    },
    filter: (secret) => {
    // filter: (secret, { secretType }) => {
      // if (secretType === 'mnemonic') {
      //   return mnemonicToMiniSecret(secret)
      // }
      return secret
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
