
/* Helper for wrapping promises which makes it super clear in logging if the promise
 * resolves or threw.
 *
 * @param {any} t - an instance to tape runner
 * @param {boolean} keepThrowing - toggle throwing
 */
export function promiseRunner(t, keepThrowing = false) {
  // NOTE: this function swallows errors

  /* 
   * @param {string} message - message to post with pass/ fail
   * @param {promise} promise - some promise to handle running
   */
  return async function run(message, promise) {
    if (promise.constructor !== Promise) {
      t.pass(message)
      return Promise.resolve(promise)
    }

    const startTime = Date.now()
    return promise
      .then((result) => {
        const time = (Date.now() - startTime) / 1000
        const noPad = message.length > 40
        const pad = noPad ? '' : Array(40 - message.length)
          .fill('-')
          .join('')
        t.pass(`${message} ${pad} ${time}s`)
        return result
      })
      .catch((err) => {
        console.log('error', err);
        t.error(err, message)
        if (keepThrowing) throw err
      })
  }
}

