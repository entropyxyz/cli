import inquirer from "inquirer"
import { accountChoices } from "../../common/utils"
import { initializeEntropy } from "../../common/initializeEntropy"

const hexToBigInt = (hexString: string) => BigInt(hexString)


export async function checkBalance ({ accounts, endpoints }, options) {
  const endpoint = endpoints[options.ENDPOINT]
  const accountQuestion = {
    type: "list",
    name: "selectedAccount",
    message: "Choose account:",
    choices: accountChoices(accounts) 
  }

  const otherQuestion = {
    type: "input",
    name: "accountAddress",
    message: "Enter the account address:",
    when: (answers) => !answers.selectedAccount
  }

  const answers = await inquirer.prompt([accountQuestion, otherQuestion])
  const selectedAccount = answers.selectedAccount
  console.log('selectedAccount:', selectedAccount)
  if (!selectedAccount) {
    console.log('whoops')
    return
  } else {
    console.log('before entropy creation', endpoint)
    const entropy = await initializeEntropy({data: {}}, endpoint)
    console.log('entropy:', entropy)
    const accountInfo = (await entropy.substrate.query.system.account(selectedAccount.address)) as any
    const freeBalance = hexToBigInt(accountInfo.data.free)
    console.log(`Address ${selectedAccount.address} has a balance of: ${freeBalance.toString()} bits`)
  }
}
