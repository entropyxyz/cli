import { handleChainEndpoint, handleUserSeed } from "../../common/questions"
import inquirer from "inquirer"
import { Controller } from "../../../controller"
import { returnToMain } from "../../common/utils"
import { initializeEntropy } from "../../common/initializeEntropy"


const question = [
  {
    type: "input",
    name: "amount",
    message: "Input amount to transfer:",
    default: "1",
  },
  {
    type: "input",
    name: "recipientAddress",
    message: "Input recipient's address:",
    default: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
  },
]

export const entropyTransfer = async (controller: Controller) => {
  try {
    const seed = await handleUserSeed()
    const endpoint = await handleChainEndpoint()

    
    const entropy = await initializeEntropy(seed, endpoint)

    await entropy.ready

    const { amount, recipientAddress } = await inquirer.prompt(question)

    if (!entropy.account?.sigRequestKey?.pair) {
      throw new Error("Signer keypair is undefined or not properly initialized.")
    }
    const tx = await entropy.substrate.tx.balances.transferAllowDeath(recipientAddress, amount)


    console.log(entropy.account.sigRequestKey.wallet)
    await tx.signAndSend(entropy.account.sigRequestKey.wallet, ({ status }) => {
      if (status.isFinalized) {
        console.log(`Transaction successful: Sent ${amount} to ${recipientAddress}`)
      }
    })
  } catch (error: any) {
    console.error("Error in entropyTransfer:", error.message)
  } finally {
    if (await returnToMain()) {
      console.clear()
      controller.emit('returnToMain')
    } else {
      controller.emit('exit')
    }
  }
}
