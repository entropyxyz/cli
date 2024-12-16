import test from 'tape'

import { lilBitsPerBits } from "../src/common/utils";
import { EntropyTransfer } from '../src/transfer/main'
import { EntropyBalance } from '../src/balance/main'
import { promiseRunner, setupTest } from './testing-utils'
import { charlieStashAddress, charlieStashSeed, DEFAULT_TOKEN_DECIMALS } from './testing-utils/constants.mjs'

test('Transfer', async (t) => {
  /* Setup */
  const run = promiseRunner(t)

  const { entropy: charlie, endpoint }= await setupTest(t, { seed: charlieStashSeed })
  const { entropy: naynay } = await setupTest(t)

  const naynayAddress = naynay.keyring.accounts.registration.address

  // Check initial balances
  let naynayBalance = await run(
    'getBalance (naynay)',
    EntropyBalance.getAnyBalance(naynay.substrate, naynayAddress)
  )
  t.equal(naynayBalance, 0, 'naynay is broke')

  let charlieBalance = await run(
    'getBalance (charlieStash)',
    EntropyBalance.getAnyBalance(charlie.substrate, charlieStashAddress)
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
    EntropyBalance.getAnyBalance(naynay.substrate, naynayAddress)
  )
  const expected = Number(inputAmount) * lilBitsPerBits(DEFAULT_TOKEN_DECIMALS)
  t.equal(naynayBalance, expected, 'naynay is rolling in it!')

  t.end()
})
