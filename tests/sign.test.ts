import test  from 'tape'

import { signWithAdapters } from '../src/flows/sign/sign'
import { setupTest, charlieStashSeed } from './testing-utils'

test('Sign - signWithAdapter', async (t) => {
  const { run, entropy } = await setupTest(t, { seed: charlieStashSeed })

  await run('register', entropy.register())

  const signature = await run(
    'sign',
    signWithAdapters(entropy, { msg: "heyo!" })
  )

  t.true(signature && signature.length > 32, 'signature has some body!')
  signature && console.log(signature)

  t.end()
})

