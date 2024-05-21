import inquirer from "inquirer"
import { accountChoices } from "../../common/utils"
import { initializeEntropy } from "../../common/initializeEntropy"
// import * as util from "@polkadot/util"

export async function register ({ accounts, endpoints, selectedAccount: selectedFromConfig }, options) {
  const endpoint = endpoints[options.ENDPOINT]

  if (!selectedFromConfig) return

  const accountQuestion = {
    type: "list",
    name: "selectedAccount",
    message: "Choose account:",
    choices: accountChoices(accounts),
  }

  const selectedAccountAnswer = await inquirer.prompt([accountQuestion])
  const selectedAccount = selectedAccountAnswer.selectedAccount

  console.log('selectedAccount', selectedAccount);
  

  const entropy = await initializeEntropy({ keyMaterial: selectedAccount.data }, endpoint)

  await entropy.ready

  const filteredAccountChoices = accountChoices(accounts).filter(choice => choice.name !== "Other")

  console.log(filteredAccountChoices);
  

  const programModKeyAccountQuestion = {
    type: "list",
    name: "programModAccount",
    message: "Choose account for programModKey or paste an address:",
    choices: [
      ...filteredAccountChoices,
      new inquirer.Separator(),
      { name: "Paste an address", value: "paste" },
    ],
  }


  const programModAccountAnswer = await inquirer.prompt([programModKeyAccountQuestion])
  let programModAccount

  if (programModAccountAnswer.programModAccount === "paste") {
    const pasteAddressQuestion = {
      type: "input",
      name: "pastedAddress",
      message: "Paste the address here:",
    }

    const pastedAddressAnswer = await inquirer.prompt([pasteAddressQuestion])
    programModAccount = pastedAddressAnswer.pastedAddress
  } else {
    programModAccount = programModAccountAnswer.programModAccount.address
  }
  console.log('programModAccount', programModAccountAnswer, programModAccount);
  
  
  console.log("Attempting to register the address:", selectedAccount.address)
  await entropy.register()

  console.log("Your address", selectedAccount.data.address, "has been successfully registered.")
}
