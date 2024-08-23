import Entropy from "@entropyxyz/sdk"
import { u8aToHex } from '@polkadot/util'
import { EntropyBase } from "../common/entropy-base";
import { getMsgFromInputOrFile, rawSign, signWithAdapters } from "./utils";
import { SignResult } from "./types";
import { FLOW_CONTEXT } from "./constants";

export class EntropySign extends EntropyBase {
  constructor (entropy: Entropy, endpoint: string) {
    super(entropy, endpoint, FLOW_CONTEXT)
  }

  public async rawSignMessage ({ msg, msgPath, auxiliaryData, hashingAlgorithm }): Promise<SignResult> {
    const message = getMsgFromInputOrFile(msg, msgPath)

    try {
      this.logger.log(`Msg to be signed: ${msg}`, 'SIGN_MSG')
      this.logger.log( `Verifying Key used: ${this.entropy.signingManager.verifyingKey}`)
      const signature = await rawSign(
        this.entropy,
        {
          sigRequestHash: Buffer.from(message).toString('hex'),
          hash: hashingAlgorithm,
          auxiliaryData
        }
      )
      const signatureHexString = u8aToHex(signature)
      this.logger.log(`Signature: ${signatureHexString}`)

      return { signature: signatureHexString, verifyingKey: this.entropy.signingManager.verifyingKey }
    } catch (error) {
      this.logger.error('Error signing message', error)
      throw error
    }
  }

  public async signMessageWithAdapters ({ msg, msgPath }: { msg?: string, msgPath?: string }): Promise<SignResult> {
    const message = getMsgFromInputOrFile(msg, msgPath)

    try {
      this.logger.log(`Msg to be signed: ${msg}`, 'SIGN_MSG')
      this.logger.log( `Verifying Key used: ${this.entropy.signingManager.verifyingKey}`)
      const signature = await signWithAdapters(this.entropy, { msg: message })
      const signatureHexString = u8aToHex(signature)
      this.logger.log(`Signature: ${signatureHexString}`)

      return { signature: signatureHexString, verifyingKey: this.entropy.signingManager.verifyingKey }
    } catch (error) {
      this.logger.error('Error signing message', error)
      throw error
    }
  }
}