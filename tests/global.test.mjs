import test from 'tape'

import { promiseRunner } from './testing-utils/promise-runner.mjs'
import { execPromise } from './testing-utils/exec-promise.mjs'

test('Global: entropy --help', async (t) => {
  /* Setup */
  const run = promiseRunner(t)

  await run('should run the global entropy --help', execPromise('entropy --help'))
  t.end()
})
