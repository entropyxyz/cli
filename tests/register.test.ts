import test from 'tape'

import { charlieStashSeed, setupTest } from './testing-utils'
import { register } from 'src/flows/register/register'
import { readFileSync } from 'node:fs'

const networkType = 'two-nodes'

test('Regsiter - Default Program', async (t) => {
  const { run, entropy } = await setupTest(t, { networkType, seed: charlieStashSeed })

  const verifyingKey = await run('register account', register(entropy))

  const fullAccount = entropy.keyring.getAccount()

  t.equal(verifyingKey, fullAccount.registration.verifyingKeys[0], 'verifying key matches key added to regsitration account')

  t.end()
})

test('Register - Barebones Program', async t => {
  const { run, entropy } = await setupTest(t, { networkType, seed: charlieStashSeed })
  const dummyProgram: any = readFileSync(
    'src/programs/template_barebones.wasm'
  )
  const pointer = await run(
    'deploy program',
    entropy.programs.dev.deploy(dummyProgram)
  )

  const verifyingKey = await run(
    'register - using custom params',
    register(entropy, {
      programModAddress: entropy.keyring.accounts.registration.address,
      programData: [{ program_pointer: pointer, program_config: '0x' }],
    })
  )

  const fullAccount = entropy.keyring.getAccount()
  
  t.equal(verifyingKey, fullAccount.registration.verifyingKeys[1], 'verifying key matches key added to regsitration account')

  t.end()
})
