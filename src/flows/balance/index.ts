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
    name: "accountAddress",
    message: "Enter the account address:",
    when: (answers) => !answers.selectedAccount
  }

  const answers = await inquirer.prompt([accountQuestion, otherQuestion])
  console.log('answers', answers);
  const selectedAccount = answers.selectedAccount
  const accountAddress = answers.accountAddress;
  console.log('selectedAccount:', selectedAccount)
  if (!selectedAccount && !accountAddress) {
    console.log('whoops')
    return
  } else {
    console.log('before entropy creation', endpoint)
    const entropyData = {
      type: 'registering',
      seed: selectedAccount?.seed ?? accountAddress,
    }
    const entropy = await initializeEntropy({ data: entropyData }, endpoint)
    const accountInfo = (await entropy.substrate.query.system.account(entropy.account.sigRequestKey.wallet.address)) as any
    const freeBalance = hexToBigInt(accountInfo.data.free)
    
    console.log(`Address ${entropy.account.sigRequestKey.wallet.address} has a balance of: ${freeBalance.toString()} bits`)
  }
}
