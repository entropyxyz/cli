import { handleChainEndpoint, handleUserSeed } from "../../common/questions"
import inquirer from "inquirer"
import { returnToMain } from "../../common/utils"
import Entropy, {EntropyAccount} from "@entropyxyz/entropy-js"
import { getWallet } from "@entropyxyz/entropy-js/src/keys"
const question = [
  {
    type: "input",
    name: "amount",
    message: "Input amount of free zaps to give",
    default: "1",
    validate: (value: any) => {
      const parsed = parseInt(value, 10)
      if (isNaN(parsed) || parsed <= 0) {
        return 'Please enter a valid amount.'
      }
      return true
    }
  },
  {
    type: "input",
    name: "account",
    message: "Account to give free zaps to",
    default: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
  },
]

export const giveZaps = async (): Promise<string> => {
  try {
    const seed = await handleUserSeed()
    const endpoint = await handleChainEndpoint()
    const signer = await getWallet(seed)

    const entropyAccount: EntropyAccount = {
      sigRequestKey: signer,
      programModKey: signer
    }
  
    const entropy = new Entropy({ account: entropyAccount })
  
    const { amount, account } = await inquirer.prompt(question)

    if (!entropy.account?.sigRequestKey?.pair) {
      throw new Error("Keys are undefined")
    }

    const confirm = await inquirer.prompt([{
      type: 'confirm',
      name: 'confirmTransaction',
      message: `Are you sure you want to give ${amount} zaps to ${account}?`,
      default: false
    }])

    if (!confirm.confirmTransaction) {
      console.log('Transaction cancelled.')
      await promptReturnToMain()
      return 'Transaction cancelled.'
    }

    const tx = entropy.substrate.tx.freeTx.giveZaps(account, amount)
    const unsub = await tx.signAndSend(entropy.account.sigRequestKey.wallet, ({ status }) => {
      if (status.isInBlock || status.isFinalized) {
        console.log(`Transaction with ${amount} zaps to ${account} is in block or finalized.`)
        unsub()
      }
    })

    await promptReturnToMain()
    return `Transaction to give ${amount} zaps to ${account} is submitted.`

  } catch (error) {
    console.error(`Failed to give zaps: ${error instanceof Error ? error.message : String(error)}`)
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
