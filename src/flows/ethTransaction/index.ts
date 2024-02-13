import inquirer from "inquirer"
import { accountChoices } from "../../common/utils"
import { initializeEntropy } from "../../common/initializeEntropy"


export async function ethTransaction ({ accounts, endpoints }, options) {
  const endpoint = endpoints[options.ENDPOINT]

  const accountQuestion = {
    type: "list",
    name: "selectedAccount",
    message: "Choose account:",
    choices: accountChoices(accounts),
  }

  const answers = await inquirer.prompt([accountQuestion])
  const selectedAccount = answers.selectedAccount

  console.log({ selectedAccount })

  const entropy = await initializeEntropy(
    { data: selectedAccount.data },
    endpoint
  )
  console.log({ entropy })

  const address = entropy.account?.sigRequestKey?.wallet.address
  console.log({ address })
  if (address == undefined) {
    throw new Error("address issue")
  }
  // for formatting transactions// 
  // const txDetails = await inquirer.prompt([
  //   {
  //     type: "input",
  //     name: "to",
  //     message: "Recipient address (0x...):",
  //     validate: (input) =>
  //       ethers.utils.isAddress(input)
  //         ? true
  //         : "Please enter a valid Ethereum address.",
  //   },
  //   {
  //     type: "input",
  //     name: "value",
  //     message: "Amount to send (in Ether):",
  //     validate: (input) =>
  //       !isNaN(parseFloat(input)) ? true : "Please enter a valid amount.",
  //   },
  // {
  //   type: "input",
  //   name: "chainId",
  //   message: "Chain ID:",
  //   default: 1, // Default to Ethereum mainnet adjust as necessary
  //   validate: (input) =>
  //     !isNaN(parseInt(input, 10)) ? true : "Please enter a valid chain ID.",
  // },
  // {
  //   type: "input",
  //   name: "data",
  //   message: "Data to send (optional):",
  //   default: "",
  // },
  // ])

  // const custonBasicTx = {
  // to: txDetails.to,
  // value: ethers.utils.parseEther(txDetails.value).toHexString(),
  // chainId: txDetails.chainId,
  // nonce: 1,
  // data: "0x" + Buffer.from(`${txDetails.data}`).toString("hex"),
  // }


  const basicTx = {
    to: '0x772b9a9e8aa1c9db861c6611a82d251db4fac990',
    value: 1,
    chainId: 5,
    gasLimit: '0x' + Number(21288n).toString(16),
    nonce: 1,
    data: '0x43726561746564204f6e20456e74726f7079'
  }

  console.log({ basicTx })

  const entropySig = await entropy.signTransaction({txParams: basicTx, type: 'eth' }) as string
  console.log({entropySig })


}
