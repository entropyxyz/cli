import { exec } from 'node:child_process'

/* Promise wrapper function of [exec](https://nodejs.org/api/child_process.html#child_processexeccommand-options-callback)
 *
 * @param {string} command - a string command to run in child process
 */

export function execPromise (command) {
  return new Promise((res, rej) => {
    exec(command, (error, stdout, stderr) => {
      if (!error && !stderr) res(stdout)
      else if (!!stderr && !error) rej(stderr)
      else if (!!error) rej(error)
    })
  })
}
