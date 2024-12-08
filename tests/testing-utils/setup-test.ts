import { Test } from 'tape'
import { Entropy, wasmGlobalsReady } from '@entropyxyz/sdk'
// @ts-ignore
import Keyring from '@entropyxyz/sdk/keys'
import { randomAsHex } from '@polkadot/util-crypto'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { initializeEntropy } from '../../src/common/initializeEntropy'
import * as config from '../../src/config'
import { DEFAULT_ENDPOINT, promiseRunner } from './'

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
    seed = randomAsHex(32),
    endpoint = DEFAULT_ENDPOINT,
  } = opts || {}

  const run = promiseRunner(t)

  await run('config.init', config.init(configPath))
  await wasmGlobalsReady()
    .catch(err => t.error(err))

  // To follow the same way we initiate entropy within the cli we must go through the same process of creating an initial keyring
  // as done in src/flows/manage-accounts/new-key.ts
  const keyring = new Keyring({ seed, debug: true })
  const entropy = await initializeEntropy({
    keyMaterial: keyring.getAccount(),
    endpoint,
    configPath
  })

  await run('entropy ready', entropy.ready)

  t.teardown(async () => {
    await entropy.close()
  })

  return { entropy, run, endpoint }
}
