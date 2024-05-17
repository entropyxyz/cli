import inquirer from "inquirer"
import { accountChoices, isEmpty } from "../../common/utils"
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
    name: "accountSeedOrPrivateKey",
    message: "Enter the account seed or private key:",
    when: (answers) => !answers.selectedAccount
  }

  const answers = await inquirer.prompt([accountQuestion, otherQuestion])
  const selectedAccount = answers.selectedAccount
  const accountSeedOrPrivateKey = answers.accountSeedOrPrivateKey
  console.log('selectedAccount:', selectedAccount)
  if (!selectedAccount && !accountSeedOrPrivateKey) {
    console.log('whoops')
    return
  } else {
    console.log('before entropy creation', endpoint)

    let keyMaterial = selectedAccount?.data;
    if (!keyMaterial || isEmpty(keyMaterial)) {
      keyMaterial = {
        seed: accountSeedOrPrivateKey,
      }
    }
    const entropy = await initializeEntropy({ keyMaterial }, endpoint)
    const accountAddress = selectedAccount?.address ?? entropy.keyring.accounts.registration.address
    
    const accountInfo = (await entropy.substrate.query.system.account(accountAddress)) as any
    const freeBalance = hexToBigInt(accountInfo.data.free)
    console.log(`Address ${accountAddress} has a balance of: ${freeBalance.toString()} bits`)
  }
}
