export const FLOW_CONTEXT = 'ENTROPY_ACCOUNTS'

export const ACCOUNTS_CONTENT = {
  seed: {
    name: 'seed',
    message: 'Enter seed:',
    invalidSeed: 'Seed provided is not valid'
  },
  path: {
    name: 'path',
    message: 'derivation path:',
    default: 'none',
  },
  importKey: {
    name: 'importKey',
    message: 'Would you like to import your own seed?',
    default: false
  },
  name: {
    name: 'name',
    default: 'My Key',
  },
  selectAccount: {
    name: "selectedAccount",
    message: "Choose account:",
  },
  interactionChoice: {
    name: 'interactionChoice',
    choices: [
      { name: 'Create/Import Account', value: 'create-import' },
      { name: 'Select Account', value: 'select-account' },
      { name: 'List Accounts', value: 'list-account' },
      { name: 'Exit to Main Menu', value: 'exit' }
    ]
  }
}