import Entropy from "@entropyxyz/sdk"
import { u8aToHex } from '@polkadot/util'
import { EntropyBase } from "../common/entropy-base";
import { SignResult } from "./types";
import { FLOW_CONTEXT } from "./constants";
import { stringToHex } from "./utils";

export class EntropySign extends EntropyBase {
  constructor (entropy: Entropy, endpoint: string) {
    super({ entropy, endpoint, flowContext: FLOW_CONTEXT })
  }

  // async rawSign (entropy: Entropy, payload: RawSignPayload) {
  //   return entropy.sign(payload)
  // }

  // async rawSignMessage ({ msg, msgPath, auxiliaryData, hashingAlgorithm }): Promise<SignResult> {
  //   const message = getMsgFromInputOrFile(msg, msgPath)

  //   try {
  //     this.logger.log(`Msg to be signed: ${msg}`, 'SIGN_MSG')
  //     this.logger.log( `Verifying Key used: ${this.entropy.signingManager.verifyingKey}`)
  //     const signature = await rawSign(
  //       this.entropy,
  //       {
  //         sigRequestHash: stringAsHex(message),
  //         hash: hashingAlgorithm,
  //         auxiliaryData
  //       }
  //     )
  //     const signatureHexString = u8aToHex(signature)
  //     this.logger.log(`Signature: ${signatureHexString}`)

  //     return { signature: signatureHexString, verifyingKey: this.entropy.signingManager.verifyingKey }
  //   } catch (error) {
  //     this.logger.error('Error signing message', error)
  //     throw error
  //   }
  // }

  async signMessageWithAdapters ({ msg }: { msg: string }): Promise<SignResult> {
    try {
      this.logger.log(`Msg to be signed: ${msg}`, 'SIGN_MSG')
      this.logger.log( `Verifying Key used: ${this.entropy.signingManager.verifyingKey}`)
      const signature: any = await this.entropy.signWithAdaptersInOrder({
        msg: {
          msg: stringToHex(msg)
        },
        // type
        order: ['deviceKeyProxy', 'noop'],
        // signatureVerifyingKey: verifyingKey
        // auxillaryData
      })

      const signatureHexString = u8aToHex(signature)
      this.logger.log(`Signature: ${signatureHexString}`)

      return { signature: signatureHexString, verifyingKey: this.entropy.signingManager.verifyingKey }
    } catch (error) {
      this.logger.error('Error signing message', error)
      throw error
    }
  }
}
