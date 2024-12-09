import inquirer from "inquirer"
import { getTokenDetails, print } from "../common/utils"
import { EntropyTransfer } from "./main"
import { transferInputQuestions } from "./utils"
import yoctoSpinner from "yocto-spinner"
import { ERROR_RED } from "src/common/constants"

const transferSpinner = yoctoSpinner()
const SPINNER_TEXT = 'Transferring funds...'
export async function entropyTransfer (entropy, endpoint) {
  transferSpinner.text = SPINNER_TEXT
  if (transferSpinner.isSpinning) transferSpinner.stop()
  try {
    const { symbol } = await getTokenDetails(entropy)
    const transferService = new EntropyTransfer(entropy, endpoint)
    const { amount, recipientAddress } = await inquirer.prompt(transferInputQuestions)
    if (!transferSpinner.isSpinning) transferSpinner.start()
    await transferService.transfer(recipientAddress, amount)
    if (transferSpinner.isSpinning) transferSpinner.stop()
    print('')
    print(`Transaction successful: Sent ${amount} ${symbol} to ${recipientAddress}`)
  } catch (error) {
    transferSpinner.text = 'Transfer failed...'
    if (transferSpinner.isSpinning) transferSpinner.stop()
    console.error(ERROR_RED + 'TransferError:', error.message);
  }
}
