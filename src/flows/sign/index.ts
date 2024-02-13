import { initializeEntropy } from "../../common/initializeEntropy"
import { accountChoices } from "../../common/utils"
import inquirer from "inquirer"
import { ethers } from "ethers"

export async function sign ({ accounts, endpoints }, options) {
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

  await entropy.ready

  const address = entropy.account?.sigRequestKey?.wallet.address
  console.log({ address })
  if (address == undefined) {
    throw new Error("address issue")
  }

  const txDetails = await inquirer.prompt([
    {
      type: "input",
      name: "to",
      message: "Recipient address (0x...):",
      validate: (input) =>
        ethers.utils.isAddress(input)
          ? true
          : "Please enter a valid Ethereum address.",
    },
    {
      type: "input",
      name: "value",
      message: "Amount to send (in Ether):",
      validate: (input) =>
        !isNaN(parseFloat(input)) ? true : "Please enter a valid amount.",
    },
    {
      type: "input",
      name: "chainId",
      message: "Chain ID:",
      default: 1, 
      validate: (input) =>
        !isNaN(parseInt(input, 10)) ? true : "Please enter a valid chain ID.",
    },
    {
      type: "input",
      name: "data",
      message: "Data to send (optional):",
      default: "",
    },
  ])

  const basicTx = {
    to: txDetails.to,
    value: ethers.utils.parseEther(txDetails.value).toHexString(),
    chainId: txDetails.chainId,
    nonce: 1,
    data: "0x" + Buffer.from(`${txDetails.data}`).toString("hex"),
  }

  const signature = (await entropy.signTransaction({
    txParams: basicTx,
    type: "eth",
  })) as string

  console.log({ signature })
}
