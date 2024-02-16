import inquirer from "inquirer"
import { exec } from 'child_process'
import util from 'util'
import { accountChoices, pubToAddress } from "../../common/utils"
import { initializeEntropy } from "../../common/initializeEntropy"
import { ethers } from "ethers"


const execAsync = util.promisify(exec)


async function getAccountBalance (address: string, infuraEndpoint: string) {
  const provider = new ethers.providers.JsonRpcProvider(infuraEndpoint)

  try {
    const balance = await provider.getBalance(address)

    return balance
  } catch (error) {
    console.error('Failed to get account balance:', error)
    return null
  }
}

async function sendCurlCommand (entropySig: string, infuraEndpoint: string) {
  const data = {
    id: 1,
    jsonrpc: "2.0",
    method: "eth_sendRawTransaction",
    params: [entropySig],
  }

  const command = `curl -H "Content-Type: application/json" -d '${JSON.stringify(data)}' '${infuraEndpoint}'`

  try {
    const { stdout, stderr } = await execAsync(command)
    console.log('CURL Output:', stdout)
    if (stderr) {
      console.error('CURL Error:', stderr)
    }
  } catch (error) {
    console.error('CURL Execution error:', error)
  }
}

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

  const entropy = await initializeEntropy(
    { data: selectedAccount.data },
    endpoint
  )

  await entropy.ready

  const address = entropy.account?.sigRequestKey?.wallet.address
  if (address == undefined) {
    throw new Error("address issue")
  }

  const infuraEndpoint = "https://goerli.infura.io/v3/66a5ebbced6a4fdb8a54d121d054b49c" 

  let ethAddress
  try {
    const verifyingKey = await entropy.getVerifyingKey(address)
    console.log({verifyingKey})
    ethAddress = pubToAddress(verifyingKey)
    console.log({ethAddress})
  } catch (error) {
    console.error("Error retrieving verifying key:", error.message)
    return // Exit if we can't get the Ethereum address
  }
  const balanceWei = await getAccountBalance(ethAddress, infuraEndpoint)
  if (balanceWei) {
    const balanceEther = ethers.utils.formatEther(balanceWei)
    console.log(`Balance: ${balanceEther} ETH`)
  } else {
    console.log('Could not retrieve account balance.')
  }
  const basicTx = {
    to: '0x772b9a9e8aa1c9db861c6611a82d251db4fac990',
    value: .00001,
    chainId: 5,
    gasLimit: '0x' + Number(21288n).toString(16),
    nonce: 1,
    data: '0x43726561746564204f6e20456e74726f7079'
  }

  // entropy.signingManager.sign = async (...args) => {
  //   const int = parseInt(args[0].sigRequestHash)
  //   console.log({int})
  //   console.log('args', args)
  //   return await entropy.signingManager.sign(...args)
  // }

  const entropySig = await entropy.signTransaction({txParams: basicTx, type: 'eth' }) as string
  console.log({entropySig})

  await sendCurlCommand(entropySig, infuraEndpoint)

}
