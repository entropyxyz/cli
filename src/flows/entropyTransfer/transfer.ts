import Entropy from "@entropyxyz/sdk";
import cliProgress from 'cli-progress'
import colors from 'ansi-colors'
import { TransferOptions } from "./types";

export async function transfer (
  entropy: Entropy,
  { 
    fromAddress, 
    fromPair, 
    to, 
    amount 
  }: TransferOptions, 
  onSuccess: () => void
): Promise<void> {
  const b1 = new cliProgress.SingleBar({
    format: 'Transferring Funds |' + colors.cyan('{bar}') + '| {percentage}%',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true
  })

  try {
    const tx = entropy.substrate.tx.balances.transferAllowDeath(
      to,
      BigInt(amount),
    )
  
    await tx.signAndSend (fromAddress || fromPair, ({ status }) => {
      // initialize the bar - defining payload token "speed" with the default value "N/A"
      b1.start(300, 0, {
        speed: "N/A"
      });
      // update values
      const interval = setInterval(() => {
        b1.increment()
      }, 100)
      if (status.isFinalized) {
        b1.stop()
        clearInterval(interval)
        onSuccess()
      }
    })
    return
  } catch (error) {
    throw new Error(error.meesage)
  }
}