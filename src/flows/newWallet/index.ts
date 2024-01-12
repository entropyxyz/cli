import { randomAsHex } from "@polkadot/util-crypto"
import { EntropyAccount } from "@entropyxyz/entropy-js"
import inquirer from 'inquirer'
import { returnToMain } from "../../common/utils"
import { initializeEntropy } from "../../common/initializeEntropy"
import { getWallet } from "@entropyxyz/entropy-js/src/keys"

export const newWallet = async (): Promise<string> => {
  try {
    const seed = randomAsHex(32)
    console.log("Seed:", seed)
    
    const signer = await getWallet(seed)
    if (!signer) {
      throw new Error("Failed to generate key pair from seed")
    }

    let entropyAccount: EntropyAccount = {
      sigRequestKey: signer,
      programModKey: signer
    }

    await initializeEntropy(entropyAccount)

    const address = signer.wallet.address
    console.log("A new wallet has been created with address:", address)
    
    await promptReturnToMain()

    return `Wallet created successfully with address: ${address}`
  } catch (error) {
    console.error(`Failed to create a new wallet: ${error instanceof Error ? error.message : String(error)}`)
    await promptReturnToMain()
    return `Error: ${error instanceof Error ? error.message : 'An unexpected error occurred'}`
  }
}

async function promptReturnToMain() {
  const { continueToMain } = await inquirer.prompt([{
    type: 'confirm',
    name: 'continueToMain',
    message: 'Press enter to return to the main menu...',
    default: true,
  }])

  if (continueToMain) {
    returnToMain()
  } else {
    process.exit()
  }
}
