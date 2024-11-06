import inquirer from "inquirer"

import { EntropyTransfer } from "./main"
import { transferInputQuestions } from "./utils"
import { print } from "../common/utils"
import { setupProgress } from "../common/progress"
import { EntropyTuiOptions } from '../types'

export async function entropyTransfer (entropy, opts: EntropyTuiOptions) {
  const progressTracker = setupProgress('Transferring Funds')
  const transferService = new EntropyTransfer(entropy, opts.endpoint)
  const { amount, recipientAddress } = await inquirer.prompt(transferInputQuestions)
  await transferService.transfer(recipientAddress, amount, progressTracker)
  print('')
  print(`Transaction successful: Sent ${amount} to ${recipientAddress}`)
  print('')
  print('Press enter to return to main menu')
}
