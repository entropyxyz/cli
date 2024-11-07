import { Test } from 'tape'
import { Entropy, wasmGlobalsReady } from '@entropyxyz/sdk'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// @ts-ignore
import { spinNetworkUp, spinNetworkDown } from "@entropyxyz/sdk/testing"
// @ts-ignore
import Keyring from '@entropyxyz/sdk/keys'

import { initializeEntropy } from '../../src/common/initializeEntropy'
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
  await run('wasm', wasmGlobalsReady())

  // To follow the same way we initiate entropy within the cli we must go through the same process of creating an initial keyring
  // as done in src/flows/manage-accounts/new-key.ts
  const keyring = new Keyring({ seed, debug: true })
  const entropy = await initializeEntropy({
    keyMaterial: keyring.getAccount(),
    endpoint,
    configPath
  })

  await run('entropy ready', entropy.ready)

  return { entropy, run, endpoint }
}
