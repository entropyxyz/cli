import { Entropy, wasmGlobalsReady } from '@entropyxyz/sdk'
import { Keyring } from '@entropyxyz/sdk/keys'
import { spinNetworkUp, spinNetworkDown, jumpStartNetwork } from '@entropyxyz/sdk/testing'
import yoctoSpinner from 'yocto-spinner'
import { promisify } from 'node:util'

import { eveSeed } from './constants.mjs'

const NETWORK_TYPE_DEFAULT = 'four-nodes'
let spinner

const [_, __, direction] = process.argv

switch (direction) {
  case 'up':
    testNetworkUp()
      .then(success)
      .catch(handleError)
    break

  case 'down':
    testNetworkDown()
      .then(success)
      .catch(handleError)
    break

  default:
    handleError(
      Error(`unknown direction "${direction}" (choose "up" or "down")`)
    )

  console.log('\n')
}



async function testNetworkUp () {
  if (!process.env.GITHUB_WORKSPACE) {
    spinner = yoctoSpinner()
    spinner.start()
  }
  const run = promiseRunner(spinner)

  // Nodes up
  await run(
    'spin up nodes',
    spinNetworkUp(NETWORK_TYPE_DEFAULT)
  )

  await wasmGlobalsReady()

  // Entropy Client
  const keyring = new Keyring({ seed: eveSeed })
  const entropy = new Entropy({
    endpoint: 'ws://127.0.0.1:9944',
    keyring: keyring
  })

  await run('set up entropy client', entropy.ready)

  if (process.env.GITHUB_WORKSPACE) {
    await run('pause', promisify(setTimeout)(10000))
  }

  // Jump-start
  const status = await getJumpstartStatus(entropy)
  switch (status) {
    case 'Ready':
      await run('jump start network', jumpStartNetwork(entropy))
      break

    case 'Done':
      console.log(`${green('✓')} jump start network (0s)`)
      break

    default:
      throw Error(`Unknown jumpStartStatus: ${jumpStartStatus}`)
  }
}

async function testNetworkDown () {
  if (!process.env.GITHUB_WORKSPACE) {
    spinner = yoctoSpinner()
    spinner.start()
  }
  const run = promiseRunner(spinner)

  // Nodes up
  await run(
    'spin down nodes',
    spinNetworkDown(NETWORK_TYPE_DEFAULT)
  )
}



// utils

function success () {
  if (spinner) {
    spinner.clear()
    spinner.stop()
  }
  process.exit(0)
}

function handleError (err) {
  console.log(err)
  if (spinner) {
    spinner.clear()
    spinner.stop()
  }
  process.exit(1)
}

async function getJumpstartStatus (entropy) {
  return entropy.substrate.query.stakingExtension.jumpStartProgress()
    .then(res => res.toHuman().jumpStartStatus)
}

function promiseRunner (spinner) {
  return async function run (msg, promise) {
    let count = 0
    let interval

    if (spinner) {
      spinner.text = msg
      spinner.start()
      interval = setInterval(() => {
        spinner.text = `${msg} (${++count}s)`
      }, 1000)
    } else {
      console.log(`${msg}...`)
      interval = setInterval(() => {
        if (++count % 30 === 0) {
          console.log(`${msg} (${count}s)`)
        }
      }, 1000)
    }

    return promise
      .then(() => {
        if (spinner) {
          spinner.stop()
          spinner.clear()
        }
        console.log(`${green('✓')} ${msg} (${count}s)`)
      })
      .finally(() => clearInterval(interval))
  }
}

function green (text) {
  const GREEN = '\x1b[32m'
  const NC = '\x1b[0m'

  return [
    GREEN,
    text,
    NC
  ].join('')
}
