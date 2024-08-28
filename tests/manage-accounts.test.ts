import test from 'tape'
import { wasmGlobalsReady } from '@entropyxyz/sdk'
// @ts-ignore
import { isValidSubstrateAddress } from '@entropyxyz/sdk/utils'
// @ts-ignore
import Keyring from '@entropyxyz/sdk/keys'
import { randomAsHex } from '@polkadot/util-crypto'
import { EntropyAccount } from '../src/account/main'
import { EntropyAccountConfig, EntropyConfig } from '../src/config/types'
import * as config from '../src/config'
import { promiseRunner, sleep } from './testing-utils'
import { charlieStashAddress, charlieStashSeed } from './testing-utils/constants'

const endpoint = "ws://127.0.0.1:9944"
const AccountService = new EntropyAccount({ endpoint });

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
    selectedAccount: account.address,
    'migration-version': '0'
  }

  const accountsArray = AccountService.list(config)

  t.deepEqual(accountsArray, [{
    name: account.name,
    address: account.address,
    verifyingKeys: account?.data?.admin?.verifyingKeys
  }])

  // Resetting accounts on config to test for empty list
  config.accounts = []
  try {
    AccountService.list(config)
  } catch (error) {
    const msg = error.message
    t.equal(msg, 'AccountsError: There are currently no accounts available, please create or import a new account using the Manage Accounts feature')
  }

  t.end()
})

let counter = 0
test('Create Account', async t => {
  const configPath = `/tmp/entropy-cli-${Date.now()}_${counter++}.json`
  /* Setup */
  const run = promiseRunner(t)
  await run('wasm', wasmGlobalsReady())
  await run('config.init', config.init(configPath))
  const testAccountSeed = randomAsHex(32)
  const testAccountName = 'Test Account'
  const newAccount = await AccountService.create({ name: testAccountName, seed: testAccountSeed })

  const testKeyring = new Keyring({ seed: testAccountSeed, path: 'none', debug: true })
  const { admin } = testKeyring.getAccount()

  const isValidAddress = isValidSubstrateAddress(newAccount.address)

  t.ok(isValidAddress, 'Valid address created')
  t.equal(newAccount.address, admin?.address, 'Generated Account matches Account created by Keyring')
  t.end()
})
