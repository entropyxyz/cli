import Entropy from "@entropyxyz/sdk"
import { u8aToHex } from '@polkadot/util'
import { readFileSync } from "fs";
import { BaseCommand } from "../common/base-command";
import { print } from "../common/utils";
import { getMsgFromInputOrFile, interactionChoiceQuestions, messageActionQuestions, rawSign, signWithAdapters, userInputQuestions } from "./utils";
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
    // case 'Raw Sign': {
    //   const msg = Buffer.from('Hello world: new signature from entropy!').toString('hex')
    //   debug('msg', msg);
    //   const signature = await entropy.sign({
    //     sigRequestHash: msg,
    //     hash: 'sha3',
    // naynay does not think he is doing this properly
    //     auxiliaryData: [
    //       {
    //         public_key_type: 'sr25519',
    //         public_key: Buffer.from(entropy.keyring.accounts.registration.pair.publicKey).toString('base64'),
    //         signature: entropy.keyring.accounts.registration.pair.sign(msg),
    //         context: 'substrate',
    //       },
    //     ],
    //   })
    
    //   print('signature:', signature)
    //   return
    // }
    case 'Sign With Adapter': {
      let msg: string
      let msgPath: string
      const { messageAction } = await inquirer.prompt(messageActionQuestions)
      switch (messageAction) {
      case 'Text Input': {
        const { userInput } = await inquirer.prompt(userInputQuestions)
        msg = userInput
        break
      }
      case 'From a File': {
        const { pathToFile } = await inquirer.prompt([{
          type: 'input',
          name: 'pathToFile',
          message: 'Enter the path to the file you wish to sign:',
        }])
        // TODO: relative/absolute path? encoding?
        msgPath = pathToFile
        break
      }
      default: {
        const error = new Error('SigningError: Unsupported User Input Action')
        this.logger.error('Error signing with adapter', error)
        return
      }
      }
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