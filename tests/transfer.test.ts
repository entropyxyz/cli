import test from 'tape'
// @ts-ignore
import Keyring from '@entropyxyz/sdk/keys'
import { 
  makeSeed,
  promiseRunner,
} from './testing-utils'

import { initializeEntropy } from '../src/common/initializeEntropy'
import { BITS_PER_TOKEN } from "../src/common/constants";
import { EntropyTransfer } from '../src/transfer/main'
import { EntropyBalance } from '../src/balance/main'
import { EntropyAccountData } from '../src/config/types'
import { charlieStashAddress, charlieStashSeed } from './testing-utils/constants.mjs'

const endpoint = 'ws://127.0.0.1:9944'

test('Transfer', async (t) => {
  /* Setup */
  const run = promiseRunner(t)

  const charlieKeyring = new Keyring({ seed: charlieStashSeed, debug: true })
  const charlieEntropy = await initializeEntropy({ keyMaterial: charlieKeyring.getAccount() as EntropyAccountData, endpoint, })
  await run('charlie ready', charlieEntropy.ready)

  const naynaySeed = makeSeed()
  const naynayKeyring = new Keyring({ seed: naynaySeed, debug: true })
  const naynayEntropy = await initializeEntropy({ keyMaterial: naynayKeyring.getAccount() as EntropyAccountData, endpoint, })
  await run('naynay ready', naynayEntropy.ready)

  const naynayAddress = naynayEntropy.keyring.accounts.registration.address

  // Check initial balances
  const balanceService = new EntropyBalance(naynayEntropy, endpoint)
  let naynayBalance = await run(
    'getBalance (naynay)',
    balanceService.getBalance(naynayAddress)
  )
  t.equal(naynayBalance, 0, 'naynay is broke')

  let charlieBalance = await run(
    'getBalance (charlieStash)',
    balanceService.getBalance(charlieStashAddress)
  )
  t.equal(charlieBalance, 1e17, 'charlie got bank')

  // Do transer
  const transferService = new EntropyTransfer(charlieEntropy, endpoint)
  const inputAmount = "1.5"
  await run(
    'transfer',
    transferService.transfer(naynayAddress, inputAmount)
  )

  // Re-Check balance
  naynayBalance = await run(
    'getBalance (naynay)',
    balanceService.getBalance(naynayAddress)
  )
  const expected = Number(inputAmount) * BITS_PER_TOKEN
  t.equal(naynayBalance, expected,'naynay is rolling in it!')

  t.end()
})
