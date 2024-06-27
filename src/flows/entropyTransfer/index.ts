import inquirer from "inquirer"
import cliProgress from 'cli-progress'
import colors from 'ansi-colors'
import { getSelectedAccount, print } from "../../common/utils"
import { initializeEntropy } from "../../common/initializeEntropy"
import { transfer } from "./transfer"

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

  const b1 = new cliProgress.SingleBar({
    format: 'Transferring Funds |' + colors.cyan('{bar}') + '| {percentage}%',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true
  })

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
    b1.start(300, 0, {
      speed: "N/A"
    })
    // update values
    const interval = setInterval(() => {
      b1.increment()
    }, 100)
    await transfer(
      entropy, 
      {
        from: entropy.keyring.accounts.registration.pair,
        to: recipientAddress,
        amount: formattedAmount
      }
    )
    b1.stop()
    clearInterval(interval)

    print(
      `\nTransaction successful: Sent ${amount} to ${recipientAddress}`
    )
    print('\nPress enter to return to main menu')
  } catch (error) {
    console.error('ERR:::', error);
  }
}
