import inquirer from "inquirer"
import { print } from "../common/utils"
import { EntropyTransfer } from "./main"
import { transferInputQuestions } from "./utils"

export async function entropyTransfer (entropy, endpoint) {
  const transferCommand = new EntropyTransfer(entropy, endpoint)
  const { amount, recipientAddress } = await inquirer.prompt(transferInputQuestions)
  await transferCommand.sendTransfer(recipientAddress, amount)
  print('')
  print(`Transaction successful: Sent ${amount} to ${recipientAddress}`)
  print('')
  print('Press enter to return to main menu')
}