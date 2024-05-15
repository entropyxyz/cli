import inquirer from "inquirer"
import { accountChoices } from "../../common/utils"
import { initializeEntropy } from "../../common/initializeEntropy"

const hexToBigInt = (hexString: string) => BigInt(hexString)


export async function checkBalance ({ accounts, endpoints }, options) {
  console.log('options', options);
  
  const endpoint = endpoints[options.ENDPOINT]
  const accountQuestion = {
    type: "list",
    name: "selectedAccount",
    message: "Choose account:",
    choices: accountChoices(accounts) 
  }

  const otherQuestion = {
    type: "input",
    name: "accountSeedOrPrivateKey",
    message: "Enter the account seed or private key:",
    when: (answers) => !answers.selectedAccount
  }

  const answers = await inquirer.prompt([accountQuestion, otherQuestion])
  console.log('answers', answers);
  const selectedAccount = answers.selectedAccount
  const accountSeedOrPrivateKey = answers.accountSeedOrPrivateKey
  console.log('selectedAccount:', selectedAccount)
  if (!selectedAccount && !accountSeedOrPrivateKey) {
    console.log('whoops')
    return
  } else {
    console.log('before entropy creation', endpoint)

    let data = selectedAccount?.data;
    if (!data || Object.keys(data).length === 0) {
      data = {
        seed: accountSeedOrPrivateKey,
      }
    }
    const entropy = await initializeEntropy({ data }, endpoint)
    console.log('entropy:', entropy)
    const accountAddress = selectedAccount?.address ?? entropy.keyring.getRegisteringKey().address
    const accountInfo = (await entropy.substrate.query.system.account(accountAddress)) as any
    const freeBalance = hexToBigInt(accountInfo.data.free)
    console.log(`Address ${accountAddress} has a balance of: ${freeBalance.toString()} bits`)
  }
}
