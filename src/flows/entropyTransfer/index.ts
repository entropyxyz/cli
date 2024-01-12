import { handleChainEndpoint, handleUserSeed } from "../../common/questions"
import inquirer from "inquirer"
import { returnToMain } from "../../common/utils"
import { initializeEntropy } from "../../common/initializeEntropy"
import { getWallet } from "@entropyxyz/entropy-js/src/keys"
import { EntropyAccount } from "@entropyxyz/entropy-js"
import Entropy from "@entropyxyz/entropy-js"

const transferQuestions = [
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
export const entropyTransfer = async (): Promise<string> => {
  try {
    const seed = await handleUserSeed()

    const signer = await getWallet(seed)

    if (!signer) {
      throw new Error("Failed to generate key pair from seed")
    }

    let entropyAccount: EntropyAccount = {
      sigRequestKey: signer,
      programModKey: signer
    }

    const entropy = new Entropy({ account: entropyAccount })
    await entropy.ready
    console.log("entropy is ready")

    if (!entropy || !entropy.account || !entropy.account.sigRequestKey?.wallet) {
      throw new Error("Entropy or wallet keys are not initialized")
    }

    const { amount, recipientAddress } = await inquirer.prompt(transferQuestions)

    const confirm = await inquirer.prompt([{
      type: 'confirm',
      name: 'proceedWithTransfer',
      message: `Are you sure you want to transfer ${amount} to ${recipientAddress}?`,
      default: false
    }])

    if (!confirm.proceedWithTransfer) {
      console.log("Transfer cancelled by user.")
      await promptReturnToMain()
      return "Transfer cancelled."
    }

    console.log("Initiating transfer...")

    const wallet = entropy.account?.sigRequestKey?.wallet
    if (!wallet) {
      throw new Error("Wallet keys are not initialized or undefined")
    }
    
    const tx = entropy.substrate.tx.balances.transfer(recipientAddress, amount)

    const TIMEOUT_DURATION = 60000 

    const transferResult = await new Promise<string>((resolve, reject) => {
      let unsubscribe: () => void

      tx.signAndSend(wallet, ({ status, events, dispatchError }) => {
        if (dispatchError) {
          if (dispatchError.isModule) {
            const decoded = entropy.substrate.registry.findMetaError(dispatchError.asModule) as any
            const { documentation, name, section } = decoded
            reject(new Error(`${section}.${name}: ${documentation.join(' ')}`))
          } else {
            reject(new Error(dispatchError.toString()))
          }
          if (unsubscribe) {
            unsubscribe() 
          }
        } else if (status.isInBlock || status.isFinalized) {
          resolve(`Sent ${amount} to ${recipientAddress}`)
          if (unsubscribe) {
            unsubscribe() 
          }
        }
      }).then(unsub => {
        unsubscribe = unsub
      }).catch(reject)

      setTimeout(() => {
        if (unsubscribe) {
          unsubscribe()
        }
        reject(new Error("Transaction timeout reached"))
      }, TIMEOUT_DURATION)
    })

    await promptReturnToMain()
    return transferResult
  } catch (error) {
    console.error(`Error during transfer: ${error instanceof Error ? error.message : String(error)}`)
    await promptReturnToMain()
    return `Error: ${error instanceof Error ? error.message : 'Transfer failed due to an unexpected error'}`
  }
}


async function promptReturnToMain() {
  const { continueToMain } = await inquirer.prompt([{
    type: 'confirm',
    name: 'continueToMain',
    message: 'Press enter to return to the main menu...',
    default: true
  }])

  if (continueToMain) {
    returnToMain()
  } else {
    process.exit()
  }
}
