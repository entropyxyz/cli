import test from 'tape'

import { BITS_PER_TOKEN } from "../src/common/constants";
import { EntropyTransfer } from '../src/transfer/main'
import { EntropyBalance } from '../src/balance/main'
import { promiseRunner, setupTest } from './testing-utils'
import { charlieStashAddress, charlieStashSeed } from './testing-utils/constants.mjs'

const endpoint = 'ws://127.0.0.1:9944'

test('Transfer', async (t) => {
  /* Setup */
  const run = promiseRunner(t)

  const { entropy: charlie }= await setupTest(t, { seed: charlieStashSeed })
  const { entropy: naynay } = await setupTest(t)

  const naynayAddress = naynay.keyring.accounts.registration.address

  // Check initial balances
  const balanceService = new EntropyBalance(naynay, endpoint)
  let naynayBalance = await run(
    'getBalance (naynay)',
    balanceService.getBalance(naynayAddress)
  )
  t.equal(naynayBalance, 0, 'naynay is broke')

  let charlieBalance = await run(
    'getBalance (charlieStash)',
    balanceService.getBalance(charlieStashAddress)
  )
  t.true(charlieBalance > 9e16, 'charlie got bank')

  // Do transer
  const transferService = new EntropyTransfer(charlie, endpoint)
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
