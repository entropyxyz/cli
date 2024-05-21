import inquirer from "inquirer"
import { debug, accountChoices } from "../../common/utils"
import { initializeEntropy } from "../../common/initializeEntropy"

export async function register ({ accounts, endpoints }, options) {
  const endpoint = endpoints[options.ENDPOINT]

  const accountQuestion = {
    type: "list",
    name: "selectedAccount",
    message: "Choose account:",
    choices: accountChoices(accounts),
  }

  const selectedAccountAnswer = await inquirer.prompt([accountQuestion])
  const selectedAccount = selectedAccountAnswer.selectedAccount
  debug('selectedAccount:', selectedAccount);
  
  const entropy = await initializeEntropy({ keyMaterial: selectedAccount.data }, endpoint)

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
  debug('programModAccount', programModAccountAnswer, programModAccount);
  
  console.log("Attempting to register the address:", selectedAccount.address)
  await entropy.register()

  console.log("Your address", selectedAccount.data.address, "has been successfully registered.")
}
