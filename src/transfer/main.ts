// @ts-ignore
import { Pair } from '@entropyxyz/sdk/keys'

import { closeSubstrate, getLoadedSubstrate } from "../common/substrate-utils";
import { EntropyLogger } from "../common/logger";
import { bitsToLilBits, formatDispatchError, getTokenDetails } from "../common/utils";

import { TransferOptions } from "./types";

const FLOW_CONTEXT = 'ENTROPY_TRANSFER'

export class EntropyTransfer {
  private readonly substrate: any
  private readonly logger: EntropyLogger
  private readonly endpoint: string
  constructor (endpoint: string) {
    this.logger = new EntropyLogger(FLOW_CONTEXT, endpoint)
    this.endpoint = endpoint
  }

  // NOTE: a more accessible function which handles
  // - setting `from`
  // - converting `amount` (string => BigInt)
  // - progress callbacks (optional)

  async transfer (from: Pair, toAddress: string, amountInBits: string) {
    const substrate = await getLoadedSubstrate(this.endpoint)
    const { decimals } = await getTokenDetails(substrate)
    const lilBits = bitsToLilBits(Number(amountInBits), decimals)

    const transferStatus = await this.rawTransfer(substrate, {
      from,
      to: toAddress,
      lilBits
    })

    await closeSubstrate(substrate)
    return transferStatus
  }

  private async rawTransfer (substrate: any, payload: TransferOptions): Promise<any> {
    const { from, to, lilBits } = payload

    return new Promise((resolve, reject) => {
      // WARN: await signAndSend is dangerous as it does not resolve
      // after transaction is complete :melt:
      substrate.tx.balances
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

