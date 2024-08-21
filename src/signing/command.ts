import Entropy from "@entropyxyz/sdk"
import { u8aToHex } from '@polkadot/util'
import { BaseCommand } from "../common/base-command";
import { print } from "../common/utils";
import { filePathInputQuestions, getMsgFromInputOrFile, getMsgFromUser, interactionChoiceQuestions, messageActionQuestions, rawSign, signWithAdapters, userInputQuestions } from "./utils";
import { SignResult } from "./types";
import { FLOW_CONTEXT } from "./constants";

export class SigningCommand extends BaseCommand {
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

  public async signMessage ({ msg, msgPath }: { msg?: string, msgPath?: string }): Promise<SignResult> {
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

  public async runInteraction (inquirer) {
    const { interactionChoice } = await inquirer.prompt(interactionChoiceQuestions)
    switch (interactionChoice) {
    case 'Raw Sign': {
      const msg = await getMsgFromUser(inquirer)
    }
    case 'Sign With Adapter': {
      const { msg, msgPath } = await getMsgFromUser(inquirer)
      const { signature, verifyingKey } = await this.signMessage({ msg, msgPath })
      print('msg to be signed:', msg)
      print('verifying key:', verifyingKey)
      print('signature:', signature)
      return
    }
    case 'Exit to Main Menu': 
      return 'exit'
    default: 
      throw new Error('Unrecognizable action')
    }
  }
}