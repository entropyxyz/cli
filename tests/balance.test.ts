import test from 'tape'

import { setupTest, charlieStashAddress as richAddress } from './testing-utils'
import { BalanceUtils } from 'src/balance/utils'

const networkType = 'two-nodes'

test('getBalance + getBalances', async (t) => {
  const { run, entropy, endpoint } = await setupTest(t, { networkType })
  const balanceUtils = new BalanceUtils(entropy, endpoint)
  const newAddress = entropy.keyring.accounts.registration.address
  
  /* getBalance */
  const newAddressBalance = await run(
    'getBalance (newSeed)',
    balanceUtils.getBalance(newAddress)
  )
  t.equal(newAddressBalance, 0, 'newSeed balance = 0')

  const richAddressBalance = await run(
    'getBalance (richAddress)',
    balanceUtils.getBalance(richAddress)
  )
  t.true(richAddressBalance > BigInt(10e10), 'richAddress balance >>> 0')

  /* getBalances */
  const balances = await run(
    'getBalances',
    balanceUtils.getBalances([newAddress, richAddress])
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
    balanceUtils.getBalances(badAddresses)
  )

  badAddresses.forEach(addr => {
    t.true(!!balancesWithNoGoodAddress[addr].error, `error field is populated for ${addr}`)
  })

  // TODO:
  // - test getBalances with 1 good address, 1 bung seed

  t.end()
})
