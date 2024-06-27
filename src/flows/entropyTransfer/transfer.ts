import Entropy from "@entropyxyz/sdk";
import { TransferOptions } from "./types";

export async function transfer (entropy: Entropy, payload: TransferOptions) {
  const { from, to, amount } = payload

  return new Promise((resolve, reject) => {
    // WARN: await signAndSend is dangerous as it does not resolve
    // after transaction is complete :melt:
    entropy.substrate.tx.balances
      .transferAllowDeath(to, amount)
      // @ts-ignore
      .signAndSend(from, ({ status, dispatchError }) => {
        if (dispatchError) {
          let msg: string
          if (dispatchError.isModule) {
            // for module errors, we have the section indexed, lookup
            const decoded = entropy.substrate.registry.findMetaError(
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