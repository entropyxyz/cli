import test from 'tape'

import { maskPayload } from '../src/common/masking'

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
