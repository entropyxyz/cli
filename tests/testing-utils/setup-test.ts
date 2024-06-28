import { Test } from 'tape'
import { Entropy, wasmGlobalsReady } from '@entropyxyz/sdk'
// @ts-ignore
import { spinNetworkUp, spinNetworkDown, } from "@entropyxyz/sdk/testing"

import { initializeEntropy } from '../../src/common/initializeEntropy'
import * as config from '../../src/config'
import { makeSeed, promiseRunner, sleep } from './'

interface SetupTestOpts {
  configPath?: string
  networkType?: string
  seed?: string,
}
const NETWORK_TYPE_DEFAULT = 'two-nodes'
let counter = 0

export async function setupTest (t: Test, opts?: SetupTestOpts): Promise<{ entropy: Entropy; run: any }> {
  const {
    configPath = `/tmp/entropy-cli-${Date.now()}_${counter++}.json`,
    networkType = NETWORK_TYPE_DEFAULT,
    seed = makeSeed()
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

  // TODO: remove this after new SDK is published
  await sleep(process.env.GITHUB_WORKSPACE ? 30_000 : 5_000)

  const entropy = await initializeEntropy({
    keyMaterial: { seed, debug: true },
    endpoint: 'ws://127.0.0.1:9944',
    configPath
  })

  await run('entropy ready', entropy.ready)

  return { entropy, run }
}