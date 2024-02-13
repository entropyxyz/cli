import inquirer from "inquirer"
import { initializeEntropy } from "../../common/initializeEntropy"
import { accountChoices } from "../../common/utils"

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

export async function giveZaps ({accounts, endpoints}, options){
  const endpoint = endpoints[options.ENDPOINT]

  const accountQuestion = {
    type: "list",
    name: "selectedAccount",
    message: "Choose account:",
    choices: accountChoices(accounts),
  }

  const answers = await inquirer.prompt([accountQuestion])
  const selectedAccount = answers.selectedAccount
  console.log("selectedAccount:", { selectedAccount })

  const entropy = await initializeEntropy(
    { data: selectedAccount.data },
    endpoint
  )

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
      }
    }
  )
}

