import test from 'tape'

import { EntropyBalance } from '../src/balance/main'
import { EntropyAccount } from '../src/account/main'
import { closeSubstrate, getLoadedSubstrate } from '../src/common/substrate-utils'

import { charlieStashAddress as richAddress, promiseRunner, DEFAULT_ENDPOINT } from './testing-utils'

test('getAnyBalance + getBalances', async (t) => {
  const run = promiseRunner(t)
  // create new account, not saved in config
  const { address: newAddress } = await EntropyAccount.create({ name: 'TestAnyBalance1' })
  const substrate = await run('load substrate', getLoadedSubstrate(DEFAULT_ENDPOINT))
  const BalanceService = new EntropyBalance(substrate, DEFAULT_ENDPOINT)
  const newAddressBalance = await run(
    'getAnyBalance (newAccount)',
    BalanceService.getAnyBalance(newAddress)
  )
  t.equal(newAddressBalance, 0, 'newSeed balance = 0')

  const richAddressBalance = await run(
    'getBalance (richAddress)',
    BalanceService.getAnyBalance(richAddress)
  )
  t.true(richAddressBalance > BigInt(10e10), 'richAddress balance >>> 0')

  /* getBalances */
  const balances = await run(
    'getBalances',
    BalanceService.getBalances([newAddress, richAddress])
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
    BalanceService.getBalances(badAddresses)
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
  const substrate = await run('load substrate', getLoadedSubstrate(DEFAULT_ENDPOINT))
  const BalanceService = new EntropyBalance(substrate, DEFAULT_ENDPOINT)
  await BalanceService.getAnyBalance('not-a-real-account')
    .then(() => t.fail('Getting balance should fail'))
    .catch(() => t.pass('Getting balance should fail'))
  await run('close substrate', closeSubstrate(substrate))
  t.end()
})
