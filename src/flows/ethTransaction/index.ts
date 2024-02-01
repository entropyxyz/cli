import inquirer from "inquirer"
import { handleChainEndpoint, handleUserSeed } from "../../common/questions"
import { Controller } from "../../../controller"
import { returnToMain } from "../../common/utils"
import { initializeEntropy } from "../../common/initializeEntropy"

const hexToBigInt = (hexString: string) => BigInt(hexString)

export const balance = async (controller: Controller) => {
  try {
    const seed = await handleUserSeed()
    const endpoint = await handleChainEndpoint()
    const entropy = await initializeEntropy(seed, endpoint)

    const balanceChoice = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: "Choose an action:",
        choices: ["Check my balance", "Query an address balance"],
      },
    ])

    let accountToCheck
    if (balanceChoice.action === "Check my balance") {
      accountToCheck = entropy.account?.sigRequestKey?.wallet.address
      if (!accountToCheck) {
        throw new Error("User address not found")
      }
    } else {
      const question = {
        type: "input",
        name: "account",
        message: "Input account to check balance for:",
        default: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
      }
      const { account: inputAccount } = await inquirer.prompt([question])
      accountToCheck = inputAccount
    }

    const accountInfo = (await entropy.substrate.query.system.account(accountToCheck)) as any
    const freeBalance = hexToBigInt(accountInfo.data.free)
    console.log(`Address ${accountToCheck} has free balance: ${freeBalance.toString()} bits`)
  } catch (error: any) {
    console.error("Error in balance:", error.message)
  } finally {
    if (await returnToMain()) {
      console.clear()
      controller.emit('returnToMain')
    } else {
      controller.emit('exit')
    }
  }
}
