import test from 'tape'
import { createSubstrate } from '@entropyxyz/sdk/utils'

import { EntropyBalance } from '../src/balance/main'
import { EntropyAccount } from '../src/account/main'
import { closeSubstrate } from '../src/common/substrate-utils'

import { charlieStashAddress as richAddress, promiseRunner, DEFAULT_ENDPOINT, eveAddress } from './testing-utils'

test('getAnyBalance + getBalances', async (t) => {
  const run = promiseRunner(t)
  // create new account, not saved in config
  const { address: newAddress } = await EntropyAccount.create({ name: 'TestAnyBalance1' })
  const substrate = createSubstrate(DEFAULT_ENDPOINT)
  await run('substrate ready', substrate.isReadyOrError)
  const newAddressBalance = await run(
    'getAnyBalance (newAccount)',
    EntropyBalance.getAnyBalance(substrate, newAddress)
  )
  t.equal(newAddressBalance, 0, 'newSeed balance = 0')

  const richAddressBalance = await run(
    'getBalance (richAddress)',
    EntropyBalance.getAnyBalance(substrate, richAddress)
  )
  t.true(richAddressBalance > BigInt(10e10), 'richAddress balance >>> 0')

  /* getBalances */
  const balances = await run(
    'getBalances',
    EntropyBalance.getBalances(substrate, [newAddress, richAddress])
  )
  t.deepEqual(
    balances,
    [
      { address: newAddress,  balance: newAddressBalance },
      { address: richAddress, balance: richAddressBalance }
    ],
    'getBalances works'
  )

  const badAddresses = ['5Cz6BfUaxxXCA3jninzxdan4JdmC1NVpgkiRPYhXbhr', '5Cz6BfUaxxXCA3jninzxdan4JdmC1NVpgkiRPYhXbhrfnD']
  const balancesWithNoGoodAddress = await run(
    'getBalances::one good address',
    EntropyBalance.getBalances(substrate, badAddresses)
  )

  badAddresses.forEach((addr) => {
    const match = balancesWithNoGoodAddress.find(info => info.address === addr)
    t.true(!!match.error, `error field is populated for ${addr}`)
  })
  await run('close substrate', closeSubstrate(substrate))

  // TODO:
  // - test getBalances with 1 good address, 1 bung seed

  t.end()
})

test('getAnyBalance: bad account', async (t) => {
  const run = promiseRunner(t)
  const substrate = createSubstrate(DEFAULT_ENDPOINT)
  await run('substrate ready', substrate.isReadyOrError)
  await EntropyBalance.getAnyBalance(substrate, 'not-a-real-account')
    .then(() => t.fail('Getting balance should fail'))
    .catch(() => t.pass('Getting balance should fail'))
  await run('close substrate', substrate.disconnect().catch(err => console.error('Error closing connection', err.message)))
  t.end()
})
