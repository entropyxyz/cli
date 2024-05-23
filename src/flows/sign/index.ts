// import inquirer from "inquirer"
import { initializeEntropy } from "../../common/initializeEntropy"
import { debug, getSelectedAccount, print } from "../../common/utils"

// TODO: revisit this file, rename as signEthTransaction?
export async function sign ({ accounts, endpoints, selectedAccount: selectedAccountAddress }, options) {
  const endpoint = endpoints[options.ENDPOINT]

  // const accountQuestion = {
  //   type: "list",
  //   name: "selectedAccount",
  //   message: "Choose account:",
  //   choices: accountChoices(accounts),
  // }

  // const otherQuestion = {
  //   type: "input",
  //   name: "accountSeedOrPrivateKey",
  //   message: "Enter the account seed or private key:",
  //   when: (answers) => !answers.selectedAccount
  // }

  // const answers = await inquirer.prompt([accountQuestion, otherQuestion])
  // const selectedAccount = answers.selectedAccount
  const selectedAccount = getSelectedAccount(accounts, selectedAccountAddress)
  debug("selectedAccount:", selectedAccount)
  // const accountSeedOrPrivateKey = answers.accountSeedOrPrivateKey
  const keyMaterial = selectedAccount?.data;
  // if (!keyMaterial || isEmpty(keyMaterial)) {
  //   keyMaterial = {
  //     seed: accountSeedOrPrivateKey,
  //   }
  // }

  const entropy = await initializeEntropy({ keyMaterial }, endpoint)

  const { address } = entropy.keyring.accounts.registration
  debug("address:", address)
  if (address == undefined) {
    throw new Error("address issue")
  }

  const msg = Buffer.from('Hello world: signature from entropy!').toString('hex')

  const signature = (await entropy.sign({
    sigRequestHash: msg,
    hash: 'sha3',
  }))

  print('signature:', signature)
}
