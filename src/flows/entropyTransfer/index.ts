import inquirer from "inquirer"
import { getSelectedAccount, print } from "../../common/utils"
import { initializeEntropy } from "../../common/initializeEntropy"
import { transfer } from "./transfer"
import { setupProgress } from "src/common/progress"

const question = [
  {
    type: "input",
    name: "amount",
    message: "Input amount to transfer:",
    default: "1",
    validate: (amount) => {
      if (isNaN(amount) || parseInt(amount) <= 0) {
        return 'Please enter a value greater than 0'
      }
      return true
    }
  },
  {
    type: "input",
    name: "recipientAddress",
    message: "Input recipient's address:",
  },
]

export async function entropyTransfer ({ accounts, selectedAccount: selectedAccountAddress }, options) {
  const { endpoint } = options
  const selectedAccount = getSelectedAccount(accounts, selectedAccountAddress)

  const { start: startProgress, stop: stopProgress } = setupProgress('Transferring Funds')

  try {
    const entropy = await initializeEntropy({
      keyMaterial: selectedAccount.data,
      endpoint
    })

    const { amount, recipientAddress } = await inquirer.prompt(question)
    
    if (!entropy?.keyring?.accounts?.registration?.pair) {
      throw new Error("Signer keypair is undefined or not properly initialized.")
    }
    const formattedAmount = BigInt(parseInt(amount) * 1e10)
    startProgress()
    const transferStatus = await transfer(
      entropy, 
      {
        from: entropy.keyring.accounts.registration.pair,
        to: recipientAddress,
        amount: formattedAmount
      }
    )
    if (transferStatus.isFinalized) stopProgress()

    print(
      `\nTransaction successful: Sent ${amount} to ${recipientAddress}`
    )
    print('\nPress enter to return to main menu')
  } catch (error) {
    stopProgress()
    console.error('ERR:::', error);
  }
}