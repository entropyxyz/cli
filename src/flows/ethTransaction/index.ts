import inquirer from "inquirer"
import { accountChoices, pubToAddress} from "../../common/utils"
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

  await entropy.ready

  const address = entropy.account?.sigRequestKey?.wallet.address
  console.log({address})
  if (address == undefined) {
    throw new Error("address issue")
  }

  try {
    const verifyingKey = await entropy.getVerifyingKey(address)
    console.log({verifyingKey})
    const ethAddress = pubToAddress(verifyingKey)
    console.log({ethAddress})
  } catch (error) {
    console.error("Error retrieving verifying key:", error.message)
  }

  const basicTx = {
    to: '0x772b9a9e8aa1c9db861c6611a82d251db4fac990',
    value: 1,
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

  
}
