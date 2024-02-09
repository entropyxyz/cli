import inquirer from "inquirer"
import { handleChainEndpoint, handleUserSeed } from "../../common/questions"
import { Controller } from "../../../controller"
import { returnToMain, isValidSubstrateAddress } from "../../common/utils"
import { initializeEntropy } from "../../common/initializeEntropy"

export async function checkBalance ({accounts, endpoint}) {
  const accountQuestion = {
    type: "list",
    name: "account",
    message: "Choose account:",
    choices: [ ...flattenAccountKeys(accounts), 'other']
  }

  const otherQuestion = {
    type: "input",
    name: "account",
    message: "Check balance of:",
    when: ({ account }) => { return (account === 'other') }
  }

  const { account } = await inquirer.prompt([ accountQuestion, otherQuestion ])
  const entropy = await initializeEntropy(null, endpoint)
  const accountInfo = (await entropy.substrate.query.system.account(account)).toHuman()
  // @ts-ignore: next line
  console.log(`Address ${account} has free balance: ${accountInfo.balance.free} bits`)
}
function flattenAccountKeys (entropyAccounts) {
  return entropyAccounts.reduce((agg, account) => {
    if (account.sigRequestKey) {
      const address = account.sigRequestKey.wallet.address
      if (!agg.include(address)) agg.push(address)
    }
    if (account.programModKey) {
      const address = account.programModKey.wallet.address
      if (!agg.include(address)) agg.push(address)
    }
    if (account.programDeployKey) {
      const address = account.programDeployKey.wallet.address
      if (!agg.include(address)) agg.push(address)
    }
  }, {})
}