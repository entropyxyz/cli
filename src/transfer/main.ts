import Entropy from "@entropyxyz/sdk";
import { EntropyBase } from "../common/entropy-base";
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

  async transfer (toAddress: string, amount: string, progress?: { start: ()=>void, stop: ()=>void }) {
    const formattedAmount = BigInt(Number(amount) * 1e10)
    // TODO: name this multiplier 1e10 somewhere

    if (progress) progress.start()
    try {
      await this.rawTransfer({
        from: this.entropy.keyring.accounts.registration.pair,
        to: toAddress,
        amount: formattedAmount
      })
      if (progress) return progress.stop()
    } catch (error) {
      if (progress) return progress.stop()
      throw error
    }
  }

  private async rawTransfer (payload: TransferOptions): Promise<any> {
    const { from, to, amount } = payload

    return new Promise((resolve, reject) => {
      // WARN: await signAndSend is dangerous as it does not resolve
      // after transaction is complete :melt:
      this.entropy.substrate.tx.balances
        .transferAllowDeath(to, amount)
        // @ts-ignore
        .signAndSend(from, ({ status, dispatchError }) => {
          if (dispatchError) {
            let msg: string
            if (dispatchError.isModule) {
              // for module errors, we have the section indexed, lookup
              const decoded = this.entropy.substrate.registry.findMetaError(
                dispatchError.asModule
              )
              const { docs, name, section } = decoded

              msg = `${section}.${name}: ${docs.join(' ')}`
            } else {
              // Other, CannotLookup, BadOrigin, no extra info
              msg = dispatchError.toString()
            }
            const error = Error(msg)
            this.logger.error('There was an issue sending this transfer', error)
            return reject(error)
          }

          if (status.isFinalized) resolve(status)
        })
    })
  }

}
