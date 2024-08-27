import test from 'tape'
import { EntropySign } from '../src/signing/main'


import { setupTest, charlieStashSeed } from './testing-utils'
const endpoint = 'ws://127.0.0.1:9944'
test('Sign - signWithAdapter', async (t) => {
  const { run, entropy } = await setupTest(t, { seed: charlieStashSeed })
  const SigningService = new EntropySign(entropy, endpoint)

  await run('register', entropy.register())
  const signature = await run(
    'sign',
    SigningService.signWithAdapters({ msg: "heyo!" })
  )

  t.true(signature && signature.length > 32, 'signature has some body!')
  signature && console.log(signature)

  t.end()
})

