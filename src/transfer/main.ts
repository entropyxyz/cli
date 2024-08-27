import Entropy from "@entropyxyz/sdk";
import { EntropyBase } from "../common/entropy-base";
import { TransferOptions } from "./types";

const FLOW_CONTEXT = 'ENTROPY_TRANSFER'

export class EntropyTransfer extends EntropyBase {
  constructor (entropy: Entropy, endpoint: string) {
    super(entropy, endpoint, FLOW_CONTEXT)
  }

  async transfer (payload: TransferOptions): Promise<any> {
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
            return reject(Error(msg))
          }
  
          if (status.isFinalized) resolve(status)
        })
    })
  }

  public async sendTransfer (toAddress: string, amount: string, startProgress?: ()=>void, stopProgress?: ()=>void) {
    const formattedAmount = BigInt(parseInt(amount) * 1e10)
    if (startProgress) startProgress()
    try {
      const transferStatus = await this.transfer({ from: this.entropy.keyring.accounts.registration.pair, to: toAddress, amount: formattedAmount })
      if (transferStatus.isFinalized) {
        if (stopProgress) return stopProgress()
        return
      }
    } catch (error) {
      this.logger.error('There was an issue sending this transfer', error)
      if (stopProgress) return stopProgress()
      throw error
    }
  }
}