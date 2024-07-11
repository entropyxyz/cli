import test from 'tape'

import { charlieStashSeed, setupTest } from './testing-utils'

const networkType = 'two-nodes'

test('Regsiter - Default Program', async (t) => {
  const { run, entropy } = await setupTest(t, { networkType, seed: charlieStashSeed })

  const verifyingKey = await run('register account', entropy.register())

  const fullAccount = entropy.keyring.getAccount()

  t.equal(verifyingKey, fullAccount.registration.verifyingKeys[0], 'verifying key matches key added to regsitration account')

  t.end()
})
