import { print } from "src/common/utils"
import { getMsgFromUser, /* interactionChoiceQuestions */ } from "./utils"
import inquirer from "inquirer"
import Entropy from "@entropyxyz/sdk"
import { EntropySign } from "./main"

export async function entropySign (entropy: Entropy, endpoint: string) {
  const signingService = new EntropySign(entropy, endpoint)
  // const { interactionChoice } = await inquirer.prompt(interactionChoiceQuestions)
  // switch (interactionChoice) {
  // case 'Raw Sign': {
  //   const { msg, msgPath } = await getMsgFromUser(inquirer)
  //   const { hashingAlgorithm, auxiliaryDataFile } = await inquirer.prompt(rawSignParamsQuestions)
  //   let hash = hashingAlgorithm
  //   const auxiliaryData = JSON.parse(readFileSync(auxiliaryDataFile).toString())
  //   if (JSON.parse(hashingAlgorithm)) {
  //     hash = JSON.parse(hashingAlgorithm)
  //   }

  //   const { signature, verifyingKey } = await Sign.rawSignMessage({ msg, msgPath, hashingAlgorithm: hash, auxiliaryData })
  //   print('msg to be signed:', msg)
  //   print('verifying key:', verifyingKey)
  //   print('signature:', signature)
  //   return
  // }
  // case 'Sign With Adapter': {
  try {
    const { msg } = await getMsgFromUser(inquirer)
    const { signature, verifyingKey } = await signingService.signMessageWithAdapters({ msg })
    print('msg to be signed:', msg)
    print('verifying key:', verifyingKey)
    print('signature:', signature)
    return
  } catch (error) {
    if (!entropy.signingManager.verifyingKey) {
      console.error('Please register your Entropy account before signing');
      return 'exit'
    }
    throw error
  }
  //  return
  // }
  // case 'Exit to Main Menu': 
  //   return 'exit'
  // default: 
  //   throw new Error('Unrecognizable action')
  // }
}
