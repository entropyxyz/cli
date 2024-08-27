import inquirer from "inquirer"
import { print } from "../common/utils"
import { EntropyTransfer } from "./main"
import { transferInputQuestions } from "./utils"
import { setupProgress } from "src/common/progress"

export async function entropyTransfer (entropy, endpoint) {
  const { start: startProgress, stop: stopProgress } = setupProgress('Transferring Funds')
  const TransferService = new EntropyTransfer(entropy, endpoint)
  const { amount, recipientAddress } = await inquirer.prompt(transferInputQuestions)
  await TransferService.sendTransfer(recipientAddress, amount, startProgress, stopProgress)
  print('')
  print(`Transaction successful: Sent ${amount} to ${recipientAddress}`)
  print('')
  print('Press enter to return to main menu')
}