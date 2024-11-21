// @ts-ignore
import { spinNetworkUp, spinNetworkDown, } from "@entropyxyz/sdk/testing"
import * as readline from 'readline'

export {
  spinNetworkUp,
  spinNetworkDown,
}

export * from './constants.mjs'
export * from './promise-runner.mjs'
export * from './exec-promise.mjs'
export * from './setup-test'

const SLEEP_DONE = '▓'
const SLEEP_TODO = '░'

export function sleep (durationInMs: number) {
  return new Promise((resolve) => {
    let count = 0

    readline.cursorTo(process.stdout, 2)

    const steps = Math.min(Math.round(durationInMs / 1000), 80)
    const stepLength = durationInMs / steps

    console.log('') // write blank link to overwrite
    const interval = setInterval(step, stepLength)

    function step() {
      count++

      if (count >= steps) {
        clearInterval(interval)

        undoLastLine()
        console.log(`sleep (${durationInMs / 1000}s)`)
        resolve('DONE')
        return
      }

      undoLastLine()
      console.log(
        [
          'sleep ',
          ...Array(count).fill(SLEEP_DONE),
          ...Array(steps - count).fill(SLEEP_TODO),
          '\n',
        ].join('')
      )
    }
  })
}
function undoLastLine() {
  readline.moveCursor(process.stdout, 0, -1)
  readline.cursorTo(process.stdout, 0)
  readline.clearLine(process.stdout, 0)
  readline.cursorTo(process.stdout, 4) // indent
}

