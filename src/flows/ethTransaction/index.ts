import inquirer from "inquirer"
import { ethers } from "ethers"
import { Controller } from "../../../controller"
import { returnToMain } from "../../common/utils"
import { privateKeyToAccount } from "viem/accounts"
import { type Hex } from "viem"
import { handleChainEndpoint, handleUserSeed } from "../../common/questions"
import { initializeEntropy } from "../../common/initializeEntropy"
import { createWalletClient, http } from "viem"
import { sepolia } from "viem/chains"
import { prepareTransactionRequest, signTransaction, sendRawTransaction, waitForTransactionReceipt} from "viem/actions"



export const ethTransaction = async (controller: Controller) => {
  const seed = await handleUserSeed()
  const endpoint = await handleChainEndpoint()

  const entropy = await initializeEntropy(seed, endpoint)

  const address = entropy.account?.sigRequestKey?.wallet.address
  console.log({ address })
  if (address == undefined) {
    throw new Error("address issue")
  }
  try {
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
    ])


    // const basicTx = {
    //   to: "0x772b9a9e8aa1c9db861c6611a82d251db4fac990",
    //   value: 1,
    //   chainId: 11155111,
    //   nonce: 1,
    //   data: '0x' + Buffer.from('Created On Entropy').toString('hex'),
    // }

    const privateKey =process.env.ETH_PK

    const account = privateKeyToAccount(
    privateKey as Hex
    )

    const client = createWalletClient({
      account,
      chain: sepolia,
      transport: http(process.env.ETH_RPC_URL),
    })


    const basicTx = await prepareTransactionRequest( client, {
      account,
      to: txDetails.to as Hex,
      value: BigInt(txDetails.value),
      data: '0x' + Buffer.from('hi').toString('hex') as Hex,
    })

    console.log({basicTx})

    const sigRequestHash = await signTransaction(client, {
      ...basicTx
    })
    console.log({sigRequestHash})

    const entropySig = await entropy.sign({sigRequestHash: sigRequestHash, hash: 'keccak',  auxilaryData: []})
    const postSign = Buffer.from(entropySig).toString('hex')

    console.log({postSign})

    if (entropySig) {

      const ethHash = await sendRawTransaction(client, { serializedTransaction: sigRequestHash })
      console.log({ethHash})

    
      const receipt = await waitForTransactionReceipt(client, {hash: ethHash})
      console.log({ receipt })

    }

  } catch (error) {
    console.error("Error constructing Ethereum transaction:", error)
  } finally {
    if (await returnToMain()) {
      console.clear()
      controller.emit("returnToMain")
    }
  }
}
