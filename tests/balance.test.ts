import test from 'tape'

import { setupTest, charlieStashAddress as richAddress, promiseRunner, DEFAULT_ENDPOINT, eveAddress } from './testing-utils'
import { EntropyBalance } from '../src/balance/main'
import { EntropyAccount } from '../src/account/main'
import { createSubstrate } from '@entropyxyz/sdk/utils'

test('getBalance + getBalances', async (t) => {
  const { run, entropy, endpoint } = await setupTest(t)
  const balanceService = new EntropyBalance(entropy, endpoint)
  const newAddress = entropy.keyring.accounts.registration.address

  /* getBalance */
  const newAddressBalance = await run(
    'getBalance (newSeed)',
    balanceService.getBalance(newAddress)
  )
  t.equal(newAddressBalance, 0, 'newSeed balance = 0')

  const richAddressBalance = await run(
    'getBalance (richAddress)',
    balanceService.getBalance(richAddress)
  )
  t.true(richAddressBalance > BigInt(10e10), 'richAddress balance >>> 0')

  /* getBalances */
  const balances = await run(
    'getBalances',
    balanceService.getBalances([newAddress, richAddress])
  )
  t.deepEqual(
    balances,
    {
      [newAddress]: {balance: newAddressBalance},
      [richAddress]: {balance: richAddressBalance}
    },
    'getBalances works'
  )

  const badAddresses = ['5Cz6BfUaxxXCA3jninzxdan4JdmC1NVpgkiRPYhXbhr', '5Cz6BfUaxxXCA3jninzxdan4JdmC1NVpgkiRPYhXbhrfnD']
  const balancesWithNoGoodAddress = await run(
    'getBalances::one good address',
    balanceService.getBalances(badAddresses)
  )

  badAddresses.forEach(addr => {
    t.true(!!balancesWithNoGoodAddress[addr].error, `error field is populated for ${addr}`)
  })

  // TODO:
  // - test getBalances with 1 good address, 1 bung seed

  t.end()
})

test('getAnyBalance: new account', async (t) => {
  const run = promiseRunner(t)
  // create new account, not saved in config
  const newAccount = await EntropyAccount.create({ name: 'TestAnyBalance1' })
  const substrate = createSubstrate(DEFAULT_ENDPOINT)
  await run('substrate ready', substrate.isReadyOrError)
  const balance = await run(
    'getAnyBalance (newAccount)',
    EntropyBalance.getAnyBalance(substrate, newAccount.address)
  )
  t.equal(balance, 0, 'newSeed balance = 0')
  await run('close substrate', substrate.disconnect().catch(err => console.error('Error closing connection', err.message)))
  t.end()
})

test('getAnyBalance: test account', async (t) => {
  const run = promiseRunner(t)
  const substrate = createSubstrate(DEFAULT_ENDPOINT)
  await run('substrate ready', substrate.isReadyOrError)
  const balance = await run(
    'getAnyBalance (eve account)',
    EntropyBalance.getAnyBalance(substrate, eveAddress)
  )
  t.true(balance > BigInt(10e10), 'richAddress balance >>> 0')
  await run('close substrate', substrate.disconnect().catch(err => console.error('Error closing connection', err.message)))
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
