import inquirer from "inquirer"
import { ethers } from "ethers"
import { Controller } from "../../../controller"
import { returnToMain } from "../../common/utils"

export const ethTransaction = async (controller: Controller) => {
  try {

    const txDetails = await inquirer.prompt([
      {
        type: 'input',
        name: 'to',
        message: 'Recipient address (0x...):',
        validate: input => ethers.utils.isAddress(input) ? true : "Please enter a valid Ethereum address.",
      },
      {
        type: 'input',
        name: 'value',
        message: 'Amount to send (in Ether):',
        validate: input => !isNaN(parseFloat(input)) ? true : "Please enter a valid amount.",
      },
      {
        type: 'input',
        name: 'chainId',
        message: 'Chain ID:',
        default: 1, // Default to Ethereum mainnet adjust as necessary
        validate: input => !isNaN(parseInt(input, 10)) ? true : "Please enter a valid chain ID.",
      },
      {
        type: 'input',
        name: 'nonce',
        message: 'Transaction nonce:',
        validate: input => !isNaN(parseInt(input, 10)) ? true : "Please enter a valid nonce.",
      },
      {
        type: 'input',
        name: 'data',
        message: 'Data to send (optional):',
        default: '',
      },
    ])

    const basicTx = {
      to: txDetails.to,
      value: ethers.utils.parseEther(txDetails.value.toString()).toString(),
      chainId: parseInt(txDetails.chainId, 10),
      nonce: parseInt(txDetails.nonce, 10),
      data: txDetails.data ? txDetails.data : '0x',
    }
    console.log("Formatted Ethereum Transaction:", JSON.stringify(basicTx, null, 2))

  } catch (error) {
    console.error("Error constructing Ethereum transaction:", error)
  } finally {
    if (await returnToMain()) {
      console.clear()
      controller.emit('returnToMain')
    }
  }
}
