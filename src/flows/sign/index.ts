import { ethers } from "ethers"
import inquirer from "inquirer"
import { handleUserSeed, handleChainEndpoint } from "../../common/questions"
import { getTx } from "../../../tx"
import { returnToMain } from "../../common/utils"
import { initializeEntropy } from "../../common/initializeEntropy"
import Entropy, {EntropyAccount} from "@entropyxyz/entropy-js"
import { getWallet } from "@entropyxyz/entropy-js/src/keys"

export const sign = async (): Promise<string> => {
  try {
    const seed = await handleUserSeed()
    const signer = await getWallet(seed)

    const entropyAccount: EntropyAccount = {
      sigRequestKey: signer,
      programModKey: signer
    }
  
    const entropy = new Entropy({ account: entropyAccount })
      let address = entropy.account?.sigRequestKey?.wallet.address

    console.log({ address })
    if (address === undefined) {
      throw new Error("Address is undefined. Please ensure that the address is correctly derived from the seed.")
    }

    const tx = await getTx()
    if (!tx) {
      throw new Error("Transaction data is undefined or invalid.")
    }

    const serializedTx = ethers.utils.serializeTransaction(tx)
    const signatureObject = await entropy.sign({
      sigRequestHash: serializedTx,
    })
    if (signatureObject) {
      const signature = ethers.utils.joinSignature(signatureObject)
      await promptReturnToMain()
      return signature
    } else {
      throw new Error("Incomplete signature. The signature must include 'r', 's', and 'v' components.")
    }
  } catch (error) {
    console.error("Error signing the transaction:", error)
    await promptReturnToMain()
    throw `Error: ${error instanceof Error ? error.message : "Unknown error occurred"}`
  }
}

async function promptReturnToMain() {
  const { continueToMain } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'continueToMain',
      message: 'Press enter to return to the main menu...',
      default: true,
    },
  ])

  if (continueToMain) {
    returnToMain()
  }
}
