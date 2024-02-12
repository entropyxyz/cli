import inquirer from "inquirer"
import { accountChoices } from "../../common/utils"
import { initializeEntropy } from "../../common/initializeEntropy"

const hexToBigInt = (hexString: string) => BigInt(hexString)


export async function checkBalance ({ accounts, endpoint }) {
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
  let accountData


  if (!selectedAccount) {
    // handle other case 
    return
  } else {
    accountData = selectedAccount.data
    console.log("Selected account data:", accountData.seed)

    const entropy = await initializeEntropy(accountData.seed, endpoint)
    const accountInfo = (await entropy.substrate.query.system.account(selectedAccount.address)) as any
    const freeBalance = hexToBigInt(accountInfo.data.free)
    console.log(`Address ${selectedAccount.address} has a balance of: ${freeBalance.toString()} bits`)
  }
}

// function flattenAccountKeys (entropyAccounts) {
//   return entropyAccounts.reduce((agg, account) => {
//     if (account.address && !agg.includes(account.address)) {
//       agg.push(account.address)
//     }
//     if (account.sigRequestKey) {
//       const address = account.sigRequestKey.wallet.address
//       if (!agg.includes(address)) agg.push(address)
//     }
//     if (account.programModKey) {
//       const address = account.programModKey.wallet.address
//       if (!agg.includes(address)) agg.push(address)
//     }
//     if (account.programDeployKey) {
//       const address = account.programDeployKey.wallet.address
//       if (!agg.includes(address)) agg.push(address)
//     }
//     return agg
//   }, [])
// }


// function accountChoices (accounts) {
//   return accounts.map(account => ({
//     name: `${account.name} (${account.address})`, 
//     value: account 
//   })).concat([{ name: 'Other', value: null }])
// }