import test from 'tape'

import { EntropySign } from '../src/sign/main'
import { setupTest, eveSeed } from './testing-utils'

const endpoint = 'ws://127.0.0.1:9944'

test('Sign - signMessageWithAdapters', async (t) => {
  const { run, entropy } = await setupTest(t, { seed: eveSeed })
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

test('Sign - signMessageWithAdapters (no verifying key)', async (t) => {
  const { entropy } = await setupTest(t)
  const signService = new EntropySign(entropy, endpoint)

  const description = 'Unregistered user gets error when they try to sign.'
  await signService.signMessageWithAdapters({ msg: "heyo!" })
    .then(() => t.fail(description))
    .catch((err) => {
      t.match(err.message, /Cannot read properties of undefined/, description)
      return
    })

  t.end()
})

