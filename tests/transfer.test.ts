import test from 'tape'
import { randomAsHex } from '@polkadot/util-crypto'
import Keyring from '@entropyxyz/sdk/keys';

import { EntropyAccount } from '../src/account/main'
import { EntropyBalance } from '../src/balance/main'
import { closeSubstrate, getLoadedSubstrate } from '../src/common/substrate-utils'
import { lilBitsPerBits } from "../src/common/utils"
import { EntropyTransfer } from '../src/transfer/main'

import { setupTest } from './testing-utils'
import { charlieStashAddress, charlieStashSeed, DEFAULT_TOKEN_DECIMALS } from './testing-utils/constants.mjs'

test('Transfer', async (t) => {
  /* Setup */
  const testAccountSeed = randomAsHex(32)
  const testAccountName = 'Test Account'
  const naynay = await EntropyAccount.import({ name: testAccountName, seed: testAccountSeed })

  // setuptest still needed to run here to start up wasm and get the config ready
  const { run, endpoint }= await setupTest(t, { seed: charlieStashSeed })
  const substrate = await run('load substrate', getLoadedSubstrate(endpoint))
  
  const naynayAddress = naynay.address
  const charlieKeyring = new Keyring({ seed: charlieStashSeed, path: '', debug: true })
  // Check initial balances
  let naynayBalance = await run(
    'getBalance (naynay)',
    EntropyBalance.getAnyBalance(substrate, naynayAddress)
  )
  t.equal(naynayBalance, 0, 'naynay is broke')

  let charlieBalance = await run(
    'getBalance (charlieStash)',
    EntropyBalance.getAnyBalance(substrate, charlieStashAddress)
  )
  t.true(charlieBalance > 9e16, 'charlie got bank')

  // Do transer
  const transferService = new EntropyTransfer(endpoint)
  const inputAmount = "1.5"
  await run(
    'transfer',
    transferService.transfer(charlieKeyring.accounts.registration.pair, naynayAddress, inputAmount)
  )

  // Re-Check balance
  naynayBalance = await run(
    'getBalance (naynay)',
    EntropyBalance.getAnyBalance(substrate, naynayAddress)
  )
  const expected = Number(inputAmount) * lilBitsPerBits(DEFAULT_TOKEN_DECIMALS)
  t.equal(naynayBalance, expected, 'naynay is rolling in it!')
  await run('closeSubstrate', closeSubstrate(substrate))
  t.end()
})
