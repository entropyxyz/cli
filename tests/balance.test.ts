import test from 'tape'
import Entropy, { wasmGlobalsReady } from '@entropyxyz/sdk'
// WIP: I'm seeing problems importing this?
import Keyring from '@entropyxyz/sdk/dist/keys/index'
import { 
  makeSeed,
  promiseRunner,
  sleep,
  spinNetworkUp,
  spinNetworkDown
} from './testing-utils'

import { getBalance, getBalances } from '../src/flows/balance/balance'
import { initializeEntropy } from 'src/common/initializeEntropy'

const networkType = 'two-nodes'

// TODO: export charlieStashSeed
const richAddress = '5Ck5SLSHYac6WFt5UZRSsdJjwmpSZq85fd5TRNAdZQVzEAPT'

test('getBalance + getBalances', async (t) => {
  /* Setup */
  const run = promiseRunner(t)
  await run('wasm', wasmGlobalsReady())
  await run('network up', spinNetworkUp(networkType))
  // this gets called after all tests are run
  t.teardown(async () => {
    await entropy.close()
    await spinNetworkDown(networkType).catch((error) =>
      console.error('Error while spinning network down', error.message)
    )
  })
  await sleep(process.env.GITHUB_WORKSPACE ? 30_000 : 5_000)

  const newSeed = makeSeed()
  const entropy = await initializeEntropy({ keyMaterial: { seed: newSeed, debug: true }, endpoint: 'ws://127.0.0.1:9944', })
  const newAddress = entropy.keyring.accounts.registration.address
  
  await run('entropy ready', entropy.ready)

  /* getBalance */
  const newAddressBalance = await run(
    'getBalance (newSeed)',
    getBalance(entropy, newAddress)
  )
  
  t.equal(newAddressBalance, 0, 'newSeed balance = 0')

  const richAddressBalance = await run(
    'getBalance (richAddress)',
    getBalance(entropy, richAddress)
  )
  
  t.true(richAddressBalance > BigInt(10e10), 'richAddress balance >>> 0')

  /* getBalances */

  const balances = await run(
    'getBalances',
    getBalances(entropy, [newAddress, richAddress])
  )

  t.deepEqual(
    balances,
    {
      [newAddress]: {balance: newAddressBalance},
      [richAddress]: {balance: richAddressBalance}
    },
    'getBalances works'
  )

  const balancesWithOneGoodAddress = await run(
    'getBalances::one good address',
    getBalances(entropy, ['000', richAddress])
  )

  console.log('balances', balancesWithOneGoodAddress);
  

  // TODO:
  // - test getBalances with 1 good address, 1 bung seed
  // - test getBalances with all bung seeds

  t.end()
})
