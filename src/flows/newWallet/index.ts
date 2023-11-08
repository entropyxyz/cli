import { randomAsHex } from "@polkadot/util-crypto"
import Entropy from "@entropyxyz/entropy-js"
import inquirer from 'inquirer'
import { returnToMain } from "../../common/utils"

export const newWallet = async (): Promise<string> => {
  try {
    const seed = randomAsHex(32)
    const entropy = new Entropy({ seed })
    await entropy.ready

    if (!entropy.keys) {
      throw new Error("Wallet keys could not be generated from the seed.")
    }

    const address = entropy.keys.wallet.address

    console.log("A new wallet has been created")
    console.log(`Seed: ${seed}`)
    console.log(`Wallet Address: ${address}`)
    
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
