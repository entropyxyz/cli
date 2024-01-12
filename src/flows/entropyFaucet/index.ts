import inquirer from "inquirer"
import { handleChainEndpoint } from "../../common/questions"
import  Entropy, { EntropyAccount } from "@entropyxyz/entropy-js"
import { getUserAddress } from "../../common/utils"
import { getWallet } from "@entropyxyz/entropy-js/src/keys"

export const entropyFaucet = async (): Promise<string> => {
  console.log("Starting Entropy Faucet...")

  try {
    const recipientAddress = await getUserAddress()
    console.log(`Recipient address: ${recipientAddress}`)

    const AliceSeed = "0xe5be9a5092b81bca64be81d212e7f2f9eba183bb7a90954f7b76361f6edb5c0a"
    const signer = await getWallet(AliceSeed)

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

    const amount = "10000000000000000"
    console.log(`Preparing to send ${amount} to ${recipientAddress}...`)

    if (!entropy || !entropy.account?.sigRequestKey?.wallet) {
      throw new Error("Entropy is not initialized or keys are undefined")
    }

    let transactionCompleted = false
    const tx = entropy.substrate.tx.balances.transfer(recipientAddress, amount)
    tx.signAndSend(entropy.account.sigRequestKey.wallet, ({ status, dispatchError }) => {
      if (dispatchError || status.isInBlock || status.isFinalized) {
        transactionCompleted = true
        if (dispatchError) {
          console.error('Dispatch error:', dispatchError)
        }
        if (status.isInBlock) {
          console.log(`Transaction included at block ${status.asInBlock}`)
          console.log(`Successfully sent ${amount} to ${recipientAddress}`)
        }
      }
    })

    // Wait for the transaction to complete or fail
    while (!transactionCompleted) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    console.log('Transaction should be completed.')

    await inquirer.prompt([
      {
        type: 'input',
        name: 'continueToMain',
        message: 'Press enter to return to the main menu...',
      },
    ])

    return 'returnToMain'
  } catch (error) {
    console.error('An error occurred:', error)
    return 'returnToMain'
  }
}
