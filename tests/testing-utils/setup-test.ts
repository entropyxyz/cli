import { wasmGlobalsReady } from '@entropyxyz/sdk'
import { spinNetworkUp, spinNetworkDown, } from "@entropyxyz/sdk/testing"

import { initializeEntropy } from '../../src/common/initializeEntropy'
import { makeSeed, promiseRunner, sleep } from './'

const NETWORK_TYPE_DEFAULT = 'two-nodes'

export async function setupTest (t, networkType = NETWORK_TYPE_DEFAULT) {
  const run = promiseRunner(t)
  await run('wasm', wasmGlobalsReady())
  await run('network up', spinNetworkUp(networkType))
  // this gets called after all tests are run
  t.teardown(async () => {
    await entropy.close()
    await spinNetworkDown(networkType).catch((error) =>
      console.error('Error while spinning network down', error.message)
    )
  })
  // TODO: remove this after new SDK is published
  await sleep(process.env.GITHUB_WORKSPACE ? 30_000 : 5_000)

  const newSeed = makeSeed()
  const entropy = await initializeEntropy({ keyMaterial: { seed: newSeed, debug: true }, endpoint: 'ws://127.0.0.1:9944', })
  const newAddress = entropy.keyring.accounts.registration.address
  
  await run('entropy ready', entropy.ready)

  return { t, run, entropy }
}
