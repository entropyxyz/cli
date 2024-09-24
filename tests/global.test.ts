import test from 'tape'

import {
  promiseRunner,
  execPromise
} from './testing-utils'

test('Global: entropy --help', async (t) => {
  /* Setup */
  const run = promiseRunner(t)

  await run('should run the global entropy --help', execPromise('entropy --help'))
  t.end()
})