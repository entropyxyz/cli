import Entropy from "@entropyxyz/sdk";

import { EntropyBase } from "../common/entropy-base";
import { bitsToTokens, formatDispatchError, getTokenDetails } from "../common/utils";
import { TransferOptions } from "./types";

const FLOW_CONTEXT = 'ENTROPY_TRANSFER'

export class EntropyTransfer extends EntropyBase {
  constructor (entropy: Entropy, endpoint: string) {
    super({ entropy, endpoint, flowContext: FLOW_CONTEXT })
  }

  // NOTE: a more accessible function which handles
  // - setting `from`
  // - converting `amount` (string => BigInt)
  // - progress callbacks (optional)

  async transfer (toAddress: string, amountInBits: string, progress?: { start: ()=>void, stop: ()=>void }) {
    const { decimals } = await getTokenDetails(this.entropy)
    const tokens = bitsToTokens(Number(amountInBits), decimals)

    if (progress) progress.start()
    try {
      await this.rawTransfer({
        from: this.entropy.keyring.accounts.registration.pair,
        to: toAddress,
        tokens
      })
      if (progress) return progress.stop()
    } catch (error) {
      if (progress) return progress.stop()
      throw error
    }
  }

  private async rawTransfer (payload: TransferOptions): Promise<any> {
    const { from, to, tokens } = payload

    return new Promise((resolve, reject) => {
      // WARN: await signAndSend is dangerous as it does not resolve
      // after transaction is complete :melt:
      this.entropy.substrate.tx.balances
        .transferAllowDeath(to, tokens)
        // @ts-ignore
        .signAndSend(from, ({ status, dispatchError }) => {
          if (dispatchError) {
            const error = formatDispatchError(this.entropy, dispatchError)
            this.logger.error('There was an issue sending this transfer', error)
            return reject(error)
          }

          if (status.isFinalized) resolve(status)
        })
    })
  }

}

