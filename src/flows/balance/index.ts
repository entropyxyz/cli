import inquirer from "inquirer"
import { debug, accountChoices } from "../../common/utils"
import { initializeEntropy } from "../../common/initializeEntropy"

const hexToBigInt = (hexString: string) => BigInt(hexString)


export async function checkBalance ({ accounts, endpoints }, options) {
  const endpoint = endpoints[options.ENDPOINT]

  const answers = await inquirer.prompt([
    {
      name: "selectedAccount",
      type: "list",
      message: "Choose account:",
      choices: accountChoices(accounts) 
    },
    {
      name: "accountSeedOrPrivateKey",
      type: "input",
      message: "Enter the account seed or private key:",
      when: (answers) => !answers.selectedAccount
    }
  ])

  const { selectedAccount, accountSeedOrPrivateKey } = answers
  debug('selectedAccount:', selectedAccount)
  if (!selectedAccount && !accountSeedOrPrivateKey) {
    console.log('whoops')
    return
  }

  debug('before entropy creation', endpoint)
  
  let data = selectedAccount?.data;
  if (!data || Object.keys(data).length === 0) {
    data = {
      seed: accountSeedOrPrivateKey,
    }
  }
  const entropy = await initializeEntropy({ data }, endpoint)
  const accountAddress = selectedAccount?.address ?? entropy.keyring.accounts.registration.address
  
  const accountInfo = (await entropy.substrate.query.system.account(accountAddress)) as any
  const freeBalance = hexToBigInt(accountInfo.data.free)

  console.log(`Address ${accountAddress} has a balance of: ${freeBalance.toString()} bits`)
}
