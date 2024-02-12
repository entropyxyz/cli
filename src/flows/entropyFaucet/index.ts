import inquirer from "inquirer"
import { accountChoices } from "../../common/utils"
import { initializeEntropy } from "../../common/initializeEntropy"

export async function entropyFaucet ({ accounts, endpoint }) {
  const accountQuestion = {
    type: "list",
    name: "selectedAccount",
    message: "Choose account:",
    choices: accountChoices(accounts),
  }

  const answers = await inquirer.prompt([accountQuestion])
  const selectedAccount = answers.selectedAccount
  const accountData = selectedAccount.data

  console.log("Selected account data:", accountData.seed)

  const recipientAddress = accountData.data.address
  const AliceSeed =
    "0xe5be9a5092b81bca64be81d212e7f2f9eba183bb7a90954f7b76361f6edb5c0a"

  const entropy = await initializeEntropy(AliceSeed, endpoint)

  await entropy.ready

  if (!entropy.account?.sigRequestKey?.pair) {
    throw new Error("Keys are undefined")
  }

  const amount = "10000000000000000"
  const tx = entropy.substrate.tx.balances.transferAllowDeath(
    recipientAddress,
    amount
  )

  await tx.signAndSend(
    entropy.account.sigRequestKey.wallet,
    async ({ status }) => {
      if (status.isInBlock || status.isFinalized) {
        console.log(recipientAddress, "funded")
      }
    }
  )
}
