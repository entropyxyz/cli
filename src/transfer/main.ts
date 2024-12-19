// @ts-ignore
import { Pair } from '@entropyxyz/sdk/keys'

import { bitsToLilBits, formatDispatchError, getTokenDetails } from "../common/utils";

import { TransferOptions } from "./types";
import { EntropySubstrateBase } from 'src/common/entropy-substrate-base';

const FLOW_CONTEXT = 'ENTROPY_TRANSFER'

export class EntropyTransfer extends EntropySubstrateBase {
  constructor (substrate: any, endpoint: string) {
    super({ substrate, endpoint, flowContext: FLOW_CONTEXT })
  }

  // NOTE: a more accessible function which handles
  // - setting `from`
  // - converting `amount` (string => BigInt)
  // - progress callbacks (optional)

  async transfer (from: Pair, toAddress: string, amountInBits: string) {
    const { decimals } = await getTokenDetails(this.substrate)
    const lilBits = bitsToLilBits(Number(amountInBits), decimals)

    const transferStatus = await this.rawTransfer({
      from,
      to: toAddress,
      lilBits
    })

    return transferStatus
  }

  private async rawTransfer (payload: TransferOptions): Promise<any> {
    const { from, to, lilBits } = payload

    return new Promise((resolve, reject) => {
      // WARN: await signAndSend is dangerous as it does not resolve
      // after transaction is complete :melt:
      this.substrate.tx.balances
        .transferAllowDeath(to, lilBits)
        // @ts-ignore
        .signAndSend(from, ({ status, dispatchError }) => {
          if (dispatchError) {
            const error = formatDispatchError(this.substrate, dispatchError)
            this.logger.error('There was an issue sending this transfer', error)
            return reject(error)
          }

          if (status.isFinalized) resolve(status)
        })
    })
  }

}

