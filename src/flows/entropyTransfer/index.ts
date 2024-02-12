import inquirer from "inquirer"
import { accountChoices } from "../../common/utils"
import { initializeEntropy } from "../../common/initializeEntropy"

const question = [
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

export async function entropyTransfer ({ accounts, endpoint }) {
  const accountQuestion = {
    type: "list",
    name: "selectedAccount",
    message: "Choose account:",
    choices: accountChoices(accounts),
  }
  const answers = await inquirer.prompt ([accountQuestion])
  const selectedAccount = answers.selectedAccount
 
  const accountData = selectedAccount.data
  console.log("Selected account data:", accountData.seed)

  const entropy = await initializeEntropy (accounts.data.seed, endpoint)

  await entropy.ready

  const { amount, recipientAddress } = await inquirer.prompt(question)

  if (!entropy.account?.sigRequestKey?.pair) {
    throw new Error("Signer keypair is undefined or not properly initialized.")
  }
  const tx = await entropy.substrate.tx.balances.transferAllowDeath(
    recipientAddress,
    amount
  )

  console.log (entropy.account.sigRequestKey.wallet)
  await tx.signAndSend (entropy.account.sigRequestKey.wallet, ({ status }) => {
    if (status.isFinalized) {
      console.log(
        `Transaction successful: Sent ${amount} to ${recipientAddress}`
      )
    }
  })
}
