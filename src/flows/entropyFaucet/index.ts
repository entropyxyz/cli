import inquirer from "inquirer"
import { accountChoices } from "../../common/utils"
import { initializeEntropy } from "../../common/initializeEntropy"

export async function entropyFaucet ({ accounts, endpoints }, options) {
  const endpoint = endpoints[options.ENDPOINT]

  const accountQuestion = {
    type: "list",
    name: "selectedAccount",
    message: "Choose account:",
    choices: accountChoices(accounts),
  }

  const answers = await inquirer.prompt([accountQuestion])
  const selectedAccount = answers.selectedAccount
  console.log({selectedAccount})

  const recipientAddress = selectedAccount.address
  const aliceData = {
    data: {
      type: "seed",
      seed: "0xe5be9a5092b81bca64be81d212e7f2f9eba183bb7a90954f7b76361f6edb5c0a",
    },
  }

  const entropy = await initializeEntropy(aliceData, endpoint)

  if (!entropy.registrationManager.signer.pair) {
    throw new Error("Keys are undefined")
  }

  const amount = "10000000000000000"
  const tx = entropy.substrate.tx.balances.transferAllowDeath(
    recipientAddress,
    amount
  )

  await tx.signAndSend(
    entropy.registrationManager.signer.pair,
    async ({ status }) => {
      if (status.isInBlock || status.isFinalized) {
        console.log(recipientAddress, "funded")
      }
    }
  )
}
