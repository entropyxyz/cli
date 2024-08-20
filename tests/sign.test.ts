import test  from 'tape'
import * as SigningUtils from '../src/signing/utils'

import { setupTest, charlieStashSeed } from './testing-utils'

test('Sign - signWithAdapter', async (t) => {
  const { run, entropy } = await setupTest(t, { seed: charlieStashSeed })

  await run('register', entropy.register())
  const signature = await run(
    'sign',
    SigningUtils.signWithAdapters(entropy, { msg: "heyo!" })
  )

  t.true(signature && signature.length > 32, 'signature has some body!')
  signature && console.log(signature)

  t.end()
})

