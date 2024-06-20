import test from 'tape'
import Entropy, { wasmGlobalsReady } from '@entropyxyz/sdk'
// WIP: I'm seeing problems importing this?
import Keyring from '@entropyxyz/sdk/keys'
import { 
  makeSeed,
  promiseRunner,
  sleep,
  spinNetworkUp,
  spinNetworkDown
} from './testing-utils'

import { getBalance, getBalances } from '../src/flows/balance/balance'

const networkType = 'two-nodes'

// TODO: export charlieStashSeed
const richSeed =
  '0x66256c4e2f90e273bf387923a9a7860f2e9f47a1848d6263de512f7fb110fc08'

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
  const keyring = new Keyring({ seed: newSeed, debug: true })
  const entropy = new Entropy({ keyring })
  await run('entropy ready', entropy.ready)

  /* getBalance */
  const newSeedBalance = await run(
    'getBalance (newSeed)',
    getBalance(entropy, newSeed)
  )
  t.equal(newSeedBalance, 0, 'newSeed balance = 0')

  const richSeedBalance = await run(
    'getBalance (richSeed)',
    getBalance(entropy, richSeed)
  )
  t.true(richSeedBalance > 10e12, 'richSeed balance >>> 0')

  /* getBalances */

  const balances = await run(
    'getBalances',
    getBalances(entropy, [newSeed, richSeed])
  )

  t.deepEqual(
    balances,
    {
      [newSeed]: newSeedBalance,
      [richSeed]: richSeedBalance
    },
    'getBalances works'
  )

  // TODO:
  // - test getBalances with 1 good seed, 1 bung seed
  // - test getBalances with all bung seeds

  t.end()
})
