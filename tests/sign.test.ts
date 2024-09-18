import test from 'tape'
import { EntropySign } from '../src/sign/main'

import { setupTest, charlieStashSeed } from './testing-utils'
const endpoint = 'ws://127.0.0.1:9944'

test('Sign - signMessageWithAdapters', async (t) => {
  const { run, entropy } = await setupTest(t, { seed: charlieStashSeed })
  const signService = new EntropySign(entropy, endpoint)

  await run('register', entropy.register())
  const result = await run(
    'sign',
    signService.signMessageWithAdapters({ msg: "heyo!" })
  )

  t.true(result?.signature?.length > 32, 'signature has some body!')
  console.log(result)

  t.end()
})

