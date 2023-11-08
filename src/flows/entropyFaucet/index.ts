import inquirer from "inquirer"
import { handleChainEndpoint } from "../../common/questions"
import { getUserAddress } from "../../common/utils"
import { initializeEntropy } from "../../common/initializeEntropy"

export const entropyFaucet = async (): Promise<string> => {
  try {
    const recipientAddress = await getUserAddress()
    const AliceSeed = "0xe5be9a5092b81bca64be81d212e7f2f9eba183bb7a90954f7b76361f6edb5c0a"
    const endpoint = await handleChainEndpoint()
    const entropy = await initializeEntropy(AliceSeed, endpoint)

    await entropy.ready

    if (!entropy.keys) {
      throw new Error("Keys are undefined")
    }

    const amount = "10000000000000000"
    const tx = entropy.substrate.tx.balances.transfer(recipientAddress, amount)

    console.log('Sending funds...')
    const unsub = await tx.signAndSend(entropy.keys.wallet, ({ status, events, dispatchError }) => {
      if (dispatchError) {
        if (dispatchError.isModule) {
          const decoded = entropy.substrate.registry.findMetaError(dispatchError.asModule) as any

          const { documentation, name, section } = decoded

          console.error(`${section}.${name}: ${documentation.join(' ')}`)
        } else {
          console.error(dispatchError.toString())
        }
      } else if (status.isInBlock) {
        console.log(`Transaction included at block ${status.asInBlock}`)
        console.log(`Successfully sent ${amount} to ${recipientAddress}`) 
      }        
      unsub()
    })

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
