import test from 'tape'
import { join } from 'path'
import { homedir } from 'os'

import { maskPayload } from '../src/common/masking'
import { absolutePath } from '../src/common/utils'

test('common/masking', async (t) => {

  t.deepEqual(
    maskPayload('dog'),
    'dog',
    'handles string'
  )

  t.deepEqual(
    maskPayload(null),
    null,
    'handles null'
  )

  t.deepEqual(
    maskPayload(true),
    true,
    'handles bool'
  )

  const buildPayload = () => {
    return {
      nested: {
        seed: 'secrets',
        secretKey: new Uint8Array([1,2,3]),
        publicKey: new Uint8Array([4,5,6]),
        arr: ['a', 'b', 'c'],
        obj: { "0": 17, "1": 23 }
      }
    }
  }
  const payload = buildPayload()
  const expected = {
    nested: {
      seed: '*'.repeat('secrets'.length),
      secretKey: '***',
      publicKey: 'data:application/UI8A;base64,BAUG',
      arr: ['a', 'b', 'c'],
      obj: { "0": 17, "1": 23 }
    }
  }
  t.deepEqual(maskPayload(payload), expected, 'nested mess')
  t.deepEqual(payload, buildPayload(), 'maskPayload does not mutate')


  t.deepEqual(maskPayload([payload, payload]), [expected, expected], 'arrays')

  t.end()
})

test.only('common/utils', (t) => {
  t.equal(
    absolutePath('/tmp/things.json'),
    '/tmp/things.json',
    'absolute path (unix)'
  )

  t.equal(
    absolutePath('C:\folder\things.json'),
    'C:\folder\things.json',
    'absolute path (win)'
  )

  t.equal(
    absolutePath('../things.json'),
    join(process.cwd(), '../things.json'),
    'relative path (to cwd)'
  )

  t.equal(
    absolutePath('~/things.json'),
    join(homedir(), './things.json'),
    'relative path (home)'
  )

  t.end()
})
