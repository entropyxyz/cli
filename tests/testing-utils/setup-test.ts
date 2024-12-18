import { Test } from 'tape'
import { Entropy, wasmGlobalsReady } from '@entropyxyz/sdk'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

// @ts-ignore
import { spinNetworkUp, spinNetworkDown, jumpStartNetwork } from "@entropyxyz/sdk/testing"
// @ts-ignore
import Keyring from '@entropyxyz/sdk/keys'

import { initializeEntropy } from '../../src/common/initializeEntropy'
import * as config from '../../src/config'
import { makeSeed, promiseRunner } from './'

interface SetupTestOpts {
  configPath?: string
  networkType?: string
  seed?: string
  endpoint?: string
  createAccountOnly?: boolean
}

const NETWORK_TYPE_DEFAULT = 'four-nodes'
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
    networkType = NETWORK_TYPE_DEFAULT,
    seed = makeSeed(),
    endpoint = 'ws://127.0.0.1:9944',
  } = opts || {}

  const run = promiseRunner(t)

  await run('wasm', wasmGlobalsReady())
  await run('network up', spinNetworkUp(networkType))
  // this gets called after t.end() is called
  t.teardown(async () => {
    await entropy.close()
    await spinNetworkDown(networkType).catch((error) =>
      console.error('Error while spinning network down', error.message)
    )
  })

  await run('config.init', config.init(configPath))

  // To follow the same way we initiate entropy within the cli we must go through the same process of creating an initial keyring
  // as done in src/flows/manage-accounts/new-key.ts
  const keyring = new Keyring({ seed, debug: true })
  const entropy = await initializeEntropy({
    // @ts-expect-error
    keyMaterial: keyring.getAccount(),
    endpoint,
    configPath
  })

  await run('entropy ready', entropy.ready)

  return { entropy, run, endpoint }
}
