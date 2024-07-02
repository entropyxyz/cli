import cliProgress from 'cli-progress'
import colors from 'ansi-colors'

export function setupProgress (label: string): { start: () => void; stop: () => void } {
  let interval: NodeJS.Timeout
  const b1 = new cliProgress.SingleBar({
    format: `${label} |` + colors.cyan('{bar}') + '| {percentage}%',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true
  })

  const start = () => {
    // 170 was found through trial and error, don't believe there is a formula to
    // determine the exact time it takes for the transaction to be processed and finalized
    // TO-DO: Change progress bar to loading animation?
    b1.start(160, 0, {
      speed: "N/A"
    })
    // update values
    interval = setInterval(() => {
      b1.increment()
    }, 100)
  }

  const stop = () => {
    b1.stop()
    clearInterval(interval)
  }

  return { start, stop }
}