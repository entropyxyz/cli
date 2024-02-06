import { handleChainEndpoint, handleUserSeed } from "../../common/questions"
import inquirer from "inquirer"
import { Controller } from "../../../controller"
import { returnToMain } from "../../common/utils"
import { initializeEntropy } from "../../common/initializeEntropy"

const question = [
  {
    type: "input",
    name: "amount",
    message: "input amount of free zaps to give",
    default: "1",
  },
  {
    type: "input",
    name: "account",
    message: "input account to give free zaps to",
    default: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
  },
]

export const giveZaps = async (controller: Controller) => {
  const seed = await handleUserSeed()
  const endpoint = await handleChainEndpoint()
  const entropy = await initializeEntropy(seed, endpoint)

  const { amount, account } = await inquirer.prompt(question)

  if (!entropy.account?.sigRequestKey?.wallet) {
    throw new Error("Keys are undefined")
  }

  const tx = entropy.substrate.tx.freeTx.giveZaps(account, amount)
  await tx.signAndSend(
    entropy.account?.sigRequestKey?.wallet,
    async ({ status }) => {
      if (status.isInBlock || status.isFinalized) {
        console.log(`${account} given ${amount} zaps`)
        
        if (await returnToMain()) {
          console.clear()
          controller.emit('returnToMain')
        } else {
          controller.emit('exit')
        }
      }
    }
  )
}

