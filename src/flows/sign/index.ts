import inquirer from "inquirer"
import { ethers } from "ethers"
import { initializeEntropy } from "../../common/initializeEntropy"
import { debug, print } from "../../common/utils"

// TODO: revisit this file, rename as signEthTransaction?
export async function sign ({ accounts, endpoints, selectedAccount: selectedAccountAddress }, options) {
  const endpoint = endpoints[options.ENDPOINT]

  // const accountQuestion = {
  //   type: "list",
  //   name: "selectedAccount",
  //   message: "Choose account:",
  //   choices: accountChoices(accounts),
  // }

  // const otherQuestion = {
  //   type: "input",
  //   name: "accountSeedOrPrivateKey",
  //   message: "Enter the account seed or private key:",
  //   when: (answers) => !answers.selectedAccount
  // }

  // const answers = await inquirer.prompt([accountQuestion, otherQuestion])
  // const selectedAccount = answers.selectedAccount
  const selectedAccount = accounts.find(obj => obj.address === selectedAccountAddress)
  debug("selectedAccount:", selectedAccount)
  // const accountSeedOrPrivateKey = answers.accountSeedOrPrivateKey
  const keyMaterial = selectedAccount?.data;
  // if (!keyMaterial || isEmpty(keyMaterial)) {
  //   keyMaterial = {
  //     seed: accountSeedOrPrivateKey,
  //   }
  // }

  const entropy = await initializeEntropy({ keyMaterial }, endpoint)

  const { address } = entropy.keyring.accounts.registration
  debug("address:", address)
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

  // TODO: this is assuming signing an eth Tx, should remove?
  const basicTx = {
    to: txDetails.to,
    value: ethers.utils.parseEther(txDetails.value).toHexString(),
    chainId: txDetails.chainId,
    nonce: 1,
    data: "0x" + Buffer.from(`${txDetails.data}`).toString("hex"),
  }

  const signature = (await entropy.signWithAdapter({
    msg: basicTx,
    type: "eth",
  })) as string

  print('signature:', signature)
}
