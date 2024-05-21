import inquirer from "inquirer"
import { accountChoices, debug, isEmpty } from "../../common/utils"
import { initializeEntropy } from "../../common/initializeEntropy"

const hexToBigInt = (hexString: string) => BigInt(hexString)


export async function checkBalance ({ accounts, endpoints }, options) {
  const endpoint = endpoints[options.ENDPOINT]

  // TODO: refactor this to make clearer control flow
  // 1. selectedAccount? great, do everything with that
  // 2. other? start a new flow for that
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
  } else {
    debug('before entropy creation', endpoint)

    let keyMaterial = selectedAccount?.data;
    if (isEmpty(keyMaterial)) {
      keyMaterial = {
        seed: accountSeedOrPrivateKey,
      }
    }
    const entropy = await initializeEntropy({ keyMaterial, endpoint })
    const accountAddress = selectedAccount?.address ?? entropy.keyring.accounts.registration.address
    
    const accountInfo = (await entropy.substrate.query.system.account(accountAddress)) as any
    const freeBalance = hexToBigInt(accountInfo.data.free)
    console.log(`Address ${accountAddress} has a balance of: ${freeBalance.toString()} bits`)
  }
}
