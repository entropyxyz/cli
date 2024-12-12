import inquirer from "inquirer"
import yoctoSpinner from "yocto-spinner"

import { getTokenDetails, print } from "../common/utils"
import { EntropyTransfer } from "./main"
import { transferInputQuestions } from "./utils"

import { EntropyTuiOptions } from '../types'

const transferSpinner = yoctoSpinner()
const SPINNER_TEXT = 'Transferring funds...'

export async function entropyTransfer (entropy, opts: EntropyTuiOptions) {
  transferSpinner.text = SPINNER_TEXT
  if (transferSpinner.isSpinning) transferSpinner.stop()
  try {
    const { symbol } = await getTokenDetails(entropy.substrate)
    const transferService = new EntropyTransfer(entropy, opts.endpoint)
    const { amount, recipientAddress } = await inquirer.prompt(transferInputQuestions)
    if (!transferSpinner.isSpinning) transferSpinner.start()
    await transferService.transfer(recipientAddress, amount)
    if (transferSpinner.isSpinning) transferSpinner.stop()
    print('')
    print(`Transaction successful: Sent ${amount} ${symbol} to ${recipientAddress}`)
    print('')
    print('Press enter to return to main menu')
  } catch (error) {
    transferSpinner.text = 'Transfer failed...'
    if (transferSpinner.isSpinning) transferSpinner.stop()
    print.error('TransferError:', error.message);
  }
}
