import inquirer from "inquirer"
import yoctoSpinner from "yocto-spinner"

import { findAccountByAddressOrName, getTokenDetails, print } from "../common/utils"
import { EntropyTransfer } from "./main"
import { transferInputQuestions } from "./utils"

import { EntropyTuiOptions } from '../types'
import { EntropyConfig } from "src/config/types"
import { closeSubstrate, getLoadedSubstrate } from "src/common/substrate-utils"
import { loadKeyring } from "src/common/load-entropy"

const transferSpinner = yoctoSpinner()
const SPINNER_TEXT = 'Transferring funds...'

export async function entropyTransfer (opts: EntropyTuiOptions, storedConfig: EntropyConfig) {
  transferSpinner.text = SPINNER_TEXT
  if (transferSpinner.isSpinning) transferSpinner.stop()
  try {
    const substrate = await getLoadedSubstrate(opts.endpoint)
    const currentAccount = findAccountByAddressOrName(storedConfig.accounts, opts.account || storedConfig.selectedAccount)
    const loadedKeyring = await loadKeyring(currentAccount)
    const { symbol } = await getTokenDetails(substrate)
    const transferService = new EntropyTransfer(opts.endpoint)
    const { amount, recipientAddress } = await inquirer.prompt(transferInputQuestions)
    if (!transferSpinner.isSpinning) transferSpinner.start()
    await transferService.transfer(loadedKeyring.accounts.registration.pair, recipientAddress, amount)
    await closeSubstrate(opts.endpoint)
    if (transferSpinner.isSpinning) transferSpinner.stop()
    print('')
    print(`Transaction successful: Sent ${amount} ${symbol} to ${recipientAddress}`)
    print('')
    print('Press enter to return to main menu')
  } catch (error) {
    transferSpinner.text = 'Transfer failed...'
    await closeSubstrate(opts.endpoint)
    if (transferSpinner.isSpinning) transferSpinner.stop()
    print.error('TransferError:', error.message);
  }
}
