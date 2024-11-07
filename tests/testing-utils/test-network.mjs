import { Entropy, wasmGlobalsReady } from '@entropyxyz/sdk'
import { Keyring } from '@entropyxyz/sdk/keys'
import { spinNetworkUp, spinNetworkDown, jumpStartNetwork } from '@entropyxyz/sdk/testing'
import yoctoSpinner from 'yocto-spinner'

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
}



async function testNetworkUp () {
  spinner = yoctoSpinner({
    spinner: {
      interval: process.env.GITHUB_WORKSPACE ? 10000 : 100
    }
  })
  spinner.start()
  const run = promiseRunner(spinner)

  // Nodes up
  await run(
    'spin up nodes',
    spinNetworkUp(NETWORK_TYPE_DEFAULT)
  )

  // Entropy Client
  const keyring = new Keyring({ seed: eveSeed })
  const entropy = new Entropy({
    endpoint: 'ws://127.0.0.1:9944',
    keyring: keyring
  })
  await run(
    'set up entropy client',
    Promise.all([ wasmGlobalsReady(), entropy.ready ])
  )

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
  spinner = yoctoSpinner({
    spinner: {
      interval: process.env.GITHUB_WORKSPACE ? 10000 : 100
    }
  })
  spinner.start()
  const run = promiseRunner(spinner)

  // Nodes up
  await run(
    'spin down nodes',
    spinNetworkDown(NETWORK_TYPE_DEFAULT)
  )
}



// utils

function success () {
  spinner.clear()
  spinner.stop()
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
    spinner.text = msg
    spinner.start()
    let count = 0
    const interval = setInterval(() => {
      spinner.text = `${msg} (${++count}s)`
    }, 1000)

    return promise
      .then(() => {
        spinner.stop()
        spinner.clear()
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
