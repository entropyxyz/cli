import test from 'tape'
import { Entropy, wasmGlobalsReady } from '@entropyxyz/sdk'
// @ts-ignore
import { isValidSubstrateAddress } from '@entropyxyz/sdk/utils'
import { jumpStartNetwork } from '@entropyxyz/sdk/testing'
// @ts-ignore
import Keyring from '@entropyxyz/sdk/keys'
import { randomAsHex } from '@polkadot/util-crypto'
import { EntropyAccount } from '../src/account/main'
import { EntropyTransfer } from '../src/transfer/main'
import { EntropyAccountConfig, EntropyConfig } from '../src/config/types'
import * as config from '../src/config'
import { promiseRunner, setupTest } from './testing-utils'
import { charlieStashAddress, charlieStashSeed, eveSeed } from './testing-utils/constants'
import { readFileSync } from 'fs'

test('Account - list', async t => {
  const account: EntropyAccountConfig = {
    name: 'Test Config',
    address: charlieStashAddress,
    data: {
      seed: charlieStashSeed,
      registration: {
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
    selectedAccount: account.name,
    'migration-version': '0'
  }

  const accountsArray = EntropyAccount.list(config)

  t.deepEqual(accountsArray, [{
    name: account.name,
    address: account.address,
    verifyingKeys: account?.data?.registration?.verifyingKeys
  }])

  // Resetting accounts on config to test for empty list
  config.accounts = []
  try {
    EntropyAccount.list(config)
  } catch (error) {
    const msg = error.message
    t.equal(msg, 'AccountsError: There are currently no accounts available, please create or import a new account using the Manage Accounts feature')
  }

  t.end()
})

let counter = 0

test('Account - import', async t => {
  const configPath = `/tmp/entropy-cli-${Date.now()}_${counter++}.json`
  /* Setup */
  const run = promiseRunner(t)
  await run('wasm', wasmGlobalsReady())
  await run('config.init', config.init(configPath))
  const testAccountSeed = randomAsHex(32)
  const testAccountName = 'Test Account'
  const newAccount = await EntropyAccount.import({ name: testAccountName, seed: testAccountSeed })

  const testKeyring = new Keyring({ seed: testAccountSeed, path: 'none', debug: true })
  const { admin } = testKeyring.getAccount()

  const isValidAddress = isValidSubstrateAddress(newAccount.address)

  t.ok(isValidAddress, 'Valid address created')
  t.equal(newAccount.address, admin?.address, 'Generated Account matches Account created by Keyring')
  t.end()
})

const endpoint = 'ws://127.0.0.1:9944'

async function fundAccount (t, entropy: Entropy) {
  const { entropy: charlie } = await setupTest(t, { seed: charlieStashSeed })
  const transfer = new EntropyTransfer(charlie, endpoint)

  await transfer.transfer(entropy.keyring.accounts.registration.address, "1000")
}


test('Account - Register: Default Program', async (t) => {
  const { run, entropy: naynay } = await setupTest(t)
  // NOTE: we fund a new account "naynay" because jumpStart has problems with charlie (T_T)
  await run('fund naynay', fundAccount(t, naynay))

  // use of charlie seed is solely to transfer funds to the naynay (fresh seed) instance.
  // these funds will be used for the jumpstart and register call
  await run('jump-start network', jumpStartNetwork(naynay))

  const account = new EntropyAccount(naynay, endpoint)
  const verifyingKey = await run('register account', account.register())

  const fullAccount = naynay.keyring.getAccount()
  t.equal(verifyingKey, fullAccount?.registration?.verifyingKeys?.[0], 'verifying key matches key added to registration account')

  t.end()
})

test('Account - Register: Barebones Program', async t => {
  const { run, entropy: naynay } = await setupTest(t)
  await run('fund naynay', fundAccount(t, naynay))
  // NOTE: we fund a new account "naynay" because jumpStart has problems with charlie (T_T)

  const dummyProgram: any = readFileSync(
    new URL('./programs/template_barebones.wasm', import.meta.url)
  )

  await run('jump-start network', jumpStartNetwork(naynay))

  const account = new EntropyAccount(naynay, endpoint)
  const pointer = await run(
    'deploy program',
    naynay.programs.dev.deploy(dummyProgram)
  )
  const verifyingKey = await run(
    'register account - with custom params',
    account.register({
      programModAddress: naynay.keyring.accounts.registration.address,
      programData: [{ program_pointer: pointer, program_config: '0x' }],
    })
  )

  const fullAccount = naynay.keyring.getAccount()
  t.equal(verifyingKey, fullAccount?.registration?.verifyingKeys?.[0], 'verifying key matches key added to registration account')

  t.end()
})

