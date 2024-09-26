import inquirer from "inquirer"

import { EntropyDance } from "./main"
import { danceInputQuestions } from "./utils"
import { print } from "../common/utils"

export async function entropyTransfer (entropy, endpoint) {
  const dance = new EntropyDance(entropy, endpoint)

  await dance.transfer(recipientAddress, amount, progressTracker)
  print('')
  print(`Transaction successful: Sent ${amount} to ${recipientAddress}`)
  print('')
  print('Press enter to return to main menu')
}
