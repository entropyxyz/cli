import { Test } from 'tape'
import { Entropy, wasmGlobalsReady } from '@entropyxyz/sdk'
// @ts-ignore
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { loadEntropyTest } from '../../src/common/load-entropy'
import * as config from '../../src/config'
import { makeSeed, promiseRunner } from './'

interface SetupTestOpts {
  configPath?: string
  seed?: string
  endpoint?: string
}

let count = 0
function uniqueConfigPath () {
  return join(
    tmpdir(),
    `entropy-cli-${Date.now()}_${count++}.json`
  )
}

export async function setupTest (t: Test, opts?: SetupTestOpts): Promise<{ entropy: Entropy; run: any; endpoint: string }> {
  const {
    configPath = uniqueConfigPath(),
    seed = makeSeed(),
    endpoint = 'ws://127.0.0.1:9944',
  } = opts || {}

  const run = promiseRunner(t)

  await run('config.init', config.init(configPath))
  await wasmGlobalsReady()
    .catch(err => t.error(err))

  const entropy = await loadEntropyTest({
    endpoint,
    seed
  })

  await run('entropy ready', entropy.ready)

  t.teardown(async () => {
    await entropy.close()
  })

  return { entropy, run, endpoint }
}
