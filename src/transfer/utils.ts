import Entropy from "@entropyxyz/sdk";
import { TransferOptions } from "./types";
import { TRANSFER_CONTENT } from "./constants";

function validateAmount (amount: string | number) {
  if (isNaN(amount as number) || parseInt(amount as string) <= 0) {
    return TRANSFER_CONTENT.amount.invalidError
  }
  return true
}

const amountQuestion = {
  type: 'input',
  name: TRANSFER_CONTENT.amount.name,
  message: TRANSFER_CONTENT.amount.message,
  default: TRANSFER_CONTENT.amount.default,
  validate: validateAmount
}

const recipientAddressQuestion = {
  type: 'input',
  name: TRANSFER_CONTENT.recipientAddress.name,
  message: TRANSFER_CONTENT.recipientAddress.message,
}

export const transferInputQuestions = [
  amountQuestion,
  recipientAddressQuestion
]

export async function transfer (entropy: Entropy, payload: TransferOptions): Promise<any> {
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