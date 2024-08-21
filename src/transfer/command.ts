import Entropy from "@entropyxyz/sdk";
import { BaseCommand } from "../common/base-command";
import { setupProgress } from "../common/progress";
import * as TransferUtils from './utils'
import inquirer from "inquirer";

const FLOW_CONTEXT = 'ENTROPY_TRANSFER'

export class TransferCommand extends BaseCommand {
  constructor (entropy: Entropy, endpoint: string) {
    super(entropy, endpoint, FLOW_CONTEXT)
  }

  public async askQuestions () {
    return inquirer.prompt(TransferUtils.transferInputQuestions)
  }

  public async sendTransfer (toAddress: string, amount: string) {
    const { start: startProgress, stop: stopProgress } = setupProgress('Transferring Funds')

    const formattedAmount = BigInt(parseInt(amount) * 1e10)
    startProgress()
    try {
      const transferStatus = await TransferUtils.transfer(this.entropy, { from: this.entropy.keyring.accounts.registration.pair, to: toAddress, amount: formattedAmount })
      if (transferStatus.isFinalized) return stopProgress()
    } catch (error) {
      this.logger.error('There was an issue sending this transfer', error)
      stopProgress()
      throw error
    }
  }
}