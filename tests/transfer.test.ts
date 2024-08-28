import test from 'tape'
import { wasmGlobalsReady } from '@entropyxyz/sdk'
// WIP: I'm seeing problems importing this?
// @ts-ignore
import Keyring from '@entropyxyz/sdk/keys'
import { 
  makeSeed,
  promiseRunner,
  spinNetworkUp,
  spinNetworkDown
} from './testing-utils'

import { initializeEntropy } from '../src/common/initializeEntropy'
import { EntropyTransfer } from '../src/transfer/main'
import { EntropyBalance } from '../src/balance/main'
import { charlieStashAddress, charlieStashSeed } from './testing-utils/constants'

const networkType = 'two-nodes'
const endpoint = 'ws://127.0.0.1:9944'

test('Transfer', async (t) => {
  /* Setup */
  const run = promiseRunner(t)
  await run('wasm', wasmGlobalsReady())
  await run('network up', spinNetworkUp(networkType))
  // this gets called after all tests are run
  t.teardown(async () => {
    await naynayEntropy.close()
    await charlieEntropy.close()
    await spinNetworkDown(networkType).catch((error) =>
      console.error('Error while spinning network down', error.message)
    )
  })

  const charlieKeyring = new Keyring({ seed: charlieStashSeed, debug: true })
  const charlieEntropy = await initializeEntropy({ keyMaterial: charlieKeyring.getAccount(), endpoint, })
  await run('charlie ready', charlieEntropy.ready)

  const naynaySeed = makeSeed()
  const naynayKeyring = new Keyring({ seed: naynaySeed, debug: true })
  const naynayEntropy = await initializeEntropy({ keyMaterial: naynayKeyring.getAccount(), endpoint, })
  await run('naynay ready', naynayEntropy.ready)

  const naynayAddress = naynayEntropy.keyring.accounts.registration.address

  // Check initial balances
  const BalanceService = new EntropyBalance(naynayEntropy, endpoint)
  let naynayBalance = await run(
    'getBalance (naynay)',
    BalanceService.getBalance(naynayAddress)
  )
  t.equal(naynayBalance, 0, 'naynay is broke')

  let charlieBalance = await run(
    'getBalance (charlieStash)',
    BalanceService.getBalance(charlieStashAddress)
  )
  t.equal(charlieBalance, 1e17, 'charlie got bank')

  // Do transer
  const TransferService = new EntropyTransfer(charlieEntropy, endpoint)
  const inputAmount = "1.5"
  await run(
    'transfer',
    TransferService.transfer(naynayAddress, inputAmount)
  )

  // Re-Check balance
  naynayBalance = await run(
    'getBalance (naynay)',
    BalanceService.getBalance(naynayAddress)
  )
  const expected = Number(inputAmount) * 1e10
  t.equal(naynayBalance, expected,'naynay is rolling in it!')

  t.end()
})
