import { EntropyAccountConfig, EntropyConfig } from 'src/types'
import test from 'tape'
import { charlieStashAddress, charlieStashSeed } from './testing-utils/constants'
import { listAccounts } from 'src/flows/manage-accounts/list'

test('List Accounts', async t => {
  const account: EntropyAccountConfig = {
    name: 'Test Config',
    address: charlieStashAddress,
    data: {
      seed: charlieStashSeed,
      admin: {
        verifyingKeys: ['this-is-a-verifying-key'],
        seed: charlieStashSeed,
        address: charlieStashAddress,
        path: '//Charlie'
      }
    }
  }
  const config: EntropyConfig = {
    accounts: [account],
    endpoints: {
      dev: 'ws://127.0.0.1:9944',
      'test-net': 'wss://testnet.entropy.xyz',
    },
    'migration-version': '0'
  }

  const accountsArray = listAccounts(config)

  t.deepEqual(accountsArray, [{
    name: account.name,
    address: account.address,
    verifyingKeys: account.data.admin.verifyingKeys
  }])

  // Resetting accounts on config to test for empty list
  config.accounts = []
  try {
    listAccounts(config)
  } catch (error) {
    const msg = error.message
    t.equal(msg, 'There are currently no accounts available, please create or import your new account using the Manage Accounts feature')
  }

  t.end()
})