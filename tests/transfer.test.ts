import test from 'tape'
import { wasmGlobalsReady } from '@entropyxyz/sdk'
// WIP: I'm seeing problems importing this?
// @ts-ignore
import Keyring from '@entropyxyz/sdk/keys'
import { 
  makeSeed,
  promiseRunner,
  sleep,
  spinNetworkUp,
  spinNetworkDown
} from './testing-utils'

import { getBalance } from '../src/flows/balance/balance'
import { initializeEntropy } from 'src/common/initializeEntropy'
import { charlieStashAddress, charlieStashSeed } from './testing-utils/constants'
import { transfer } from 'src/flows/entropyTransfer/transfer'

const networkType = 'two-nodes'

test('Transfer', async (t) => {
  /* Setup */
  const run = promiseRunner(t)
  await run('wasm', wasmGlobalsReady())
  await run('network up', spinNetworkUp(networkType))
  // this gets called after all tests are run
  t.teardown(async () => {
    await entropy.close()
    await charlieEntropy.close()
    await spinNetworkDown(networkType).catch((error) =>
      console.error('Error while spinning network down', error.message)
    )
  })
  await sleep(process.env.GITHUB_WORKSPACE ? 30_000 : 5_000)

  const naynaySeed = makeSeed()
  const naynayKeyring = new Keyring({ seed: naynaySeed, debug: true })
  const charlieKeyring = new Keyring({ seed: charlieStashSeed, debug: true })
  
  const entropy = await initializeEntropy({ keyMaterial: naynayKeyring.getAccount(), endpoint: 'ws://127.0.0.1:9944', })
  const charlieEntropy = await initializeEntropy({ keyMaterial: charlieKeyring.getAccount(), endpoint: 'ws://127.0.0.1:9944', })
  await run('entropy ready', entropy.ready)
  await run('charlie ready', charlieEntropy.ready)
  
  const recipientAddress = entropy.keyring.accounts.registration.address

  // Check Balance of new account
  let naynayBalance = await run(
    'getBalance (naynay)',
    getBalance(entropy, recipientAddress)
  )

  t.equal(naynayBalance, 0, 'naynay is broke')

  let charlieBalance = await run(
    'getBalance (charlieStash)',
    getBalance(entropy, charlieStashAddress)
  )

  t.equal(charlieBalance, 1e17, 'charlie got bank')

  const transferStatus = await run(
    'transfer',
    transfer(entropy, {
      from: charlieEntropy.keyring.accounts.registration.pair,
      to: recipientAddress,
      amount: BigInt(1000 * 10e10)
    })
  )
  // @ts-ignore
  t.true(transferStatus?.isFinalized, 'Funds transferred successfully')

  // Re-Check Balance of new account
  naynayBalance = await run(
    'getBalance (naynay)',
    getBalance(entropy, recipientAddress)
  )

  t.equal(naynayBalance, 1000 * 10e10, 'naynay is rolling in it!')
  
  t.end()
})