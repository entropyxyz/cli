import inquirer from "inquirer"
import { getTokenDetails, print } from "../common/utils"
import { EntropyTransfer } from "./main"
import { transferInputQuestions } from "./utils"
import { setupProgress } from "src/common/progress"

export async function entropyTransfer (entropy, endpoint) {
  const progressTracker = setupProgress('Transferring Funds')
  const { symbol } = await getTokenDetails(entropy)
  const transferService = new EntropyTransfer(entropy, endpoint)
  const { amount, recipientAddress } = await inquirer.prompt(transferInputQuestions)
  await transferService.transfer(recipientAddress, amount, progressTracker)
  print('')
  print(`Transaction successful: Sent ${amount} ${symbol} to ${recipientAddress}`)
  print('')
  print('Press enter to return to main menu')
}
