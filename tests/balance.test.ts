import test from 'tape'

import { getBalance, getBalances } from '../src/flows/balance/balance'
import { setupTest } from './testing-utils'

const networkType = 'two-nodes'
// TODO: export charlieStashSeed
const richAddress = '5Ck5SLSHYac6WFt5UZRSsdJjwmpSZq85fd5TRNAdZQVzEAPT'

test('getBalance + getBalances', async (t) => {
  const { run, entropy } = await setupTest(t, networkType)

  const newAddress = entropy.keyring.accounts.registration.address
  
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

  const badAddresses = ['5Cz6BfUaxxXCA3jninzxdan4JdmC1NVpgkiRPYhXbhr', '5Cz6BfUaxxXCA3jninzxdan4JdmC1NVpgkiRPYhXbhrfnD']
  const balancesWithNoGoodAddress = await run(
    'getBalances::one good address',
    getBalances(entropy, badAddresses)
  )

  badAddresses.forEach(addr => {
    t.true(!!balancesWithNoGoodAddress[addr].error, `error field is populated for ${addr}`)
  })

  // TODO:
  // - test getBalances with 1 good address, 1 bung seed

  t.end()
})
