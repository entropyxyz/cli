import Entropy from "@entropyxyz/sdk";
import { EntropyBase } from "../common/entropy-base";
import { setupProgress } from "../common/progress";
import * as TransferUtils from './utils'

const FLOW_CONTEXT = 'ENTROPY_TRANSFER'

export class EntropyTransfer extends EntropyBase {
  constructor (entropy: Entropy, endpoint: string) {
    super(entropy, endpoint, FLOW_CONTEXT)
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