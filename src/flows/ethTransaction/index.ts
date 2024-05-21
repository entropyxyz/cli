import inquirer from "inquirer"
import { exec } from 'child_process'
import util from 'util'
import { ethers } from "ethers"
import { http, Hex, createPublicClient } from 'viem'
import { sepolia } from 'viem/chains'
import { accountChoices, debug, pubToAddress } from "../../common/utils"
import { initializeEntropy } from "../../common/initializeEntropy"

const execAsync = util.promisify(exec)

async function getAccountBalance (address: string, sepoliaEndpoint: string): Promise<ethers.BigNumber | null> {
  const client = createPublicClient({
    chain: sepolia,
    transport: http(sepoliaEndpoint)
  })
  
  try {
    const balance = await client.getBalance({ 
      address: address as Hex,
    })   
     
    return ethers.BigNumber.from(balance)
  } catch (error) {
    console.error('Failed to get account balance:', error)
    return null
  }
}
async function getSenderAddressFromSignedTx (signedTx: string): Promise<string> {
  try {
    const tx = ethers.utils.parseTransaction(signedTx)
    console.log({tx})
    return tx.from
  } catch (error) {
    console.error('Error extracting sender address:', error)
    return ''
  }
}

async function sendCurlCommand (entropySig: string, sepoliaEndpoint: string) {
  try {
    const senderAddress = await getSenderAddressFromSignedTx(entropySig)
    console.log(`Transaction being sent from address: ${senderAddress}`)

    const data = {
      id: 1,
      jsonrpc: "2.0",
      method: "eth_sendRawTransaction",
      params: [entropySig],
    }

    const command = `curl -H "Content-Type: application/json" -d '${JSON.stringify(data)}' '${sepoliaEndpoint}'`
    const { stdout, stderr } = await execAsync(command)
    debug('CURL Output:', stdout)
    if (stderr) debug('CURL Error:', stderr)
  } catch (error) {
    debug('CURL Execution error:', error)
    console.error('Error sending transaction')
  }
}

export async function ethTransaction ({ accounts, endpoints }, options): Promise<void> {
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

  const { address } = entropy.keyring.accounts.registration
  if (address === undefined) {
    throw new Error("Address issue")
  }

  const sepoliaEndpoint = "https://eth-sepolia.g.alchemy.com/v2/geXkc0T7yFx_xEszvBzg2T5pWy0uNjFS"

  let ethAddress: string
  try {
    const verifyingKey = await entropy.getVerifyingKey(address)
    debug('verifyingKey:', verifyingKey)
    ethAddress = pubToAddress(verifyingKey)
    debug('ethAddress:', ethAddress)
  } catch (error) {
    console.error("Error retrieving verifying key:", error.message)
    return
  }

  const balanceWei = await getAccountBalance(ethAddress, sepoliaEndpoint)
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
    gasPrice: ethers.utils.hexlify(ethers.utils.parseUnits("2", "gwei")),
    nonce: 1,
    data: '0x43726561746564204f6e20456e74726f7079'
  }


  const entropySig = await entropy.signWithAdapter({ msg: basicTx, type: 'eth' }) as string
  const addy = await getSenderAddressFromSignedTx(entropySig)
  debug('sender address:', addy)
  debug('entropy signature:', entropySig)

  await sendCurlCommand(entropySig, sepoliaEndpoint)
}
