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

  const entropy = await initializeEntropy({ data: selectedAccount.data }, endpoint)

  await entropy.ready


  const filteredAccountChoices = accountChoices(accounts).filter(choice => choice.name !== "Other")

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

  const isRegistered = await entropy.isRegistered(selectedAccount.address)

  if (isRegistered) {
    console.log("Address is already registered:", selectedAccount.address)
  } else {
    const pointer = "0x3873f6f91334cfb6cad84f94aa1e1025069405a4ea3577a818a5ad8d0e26bb39"
    const programConfig = "0x"

    const programData = {
      programPointer: pointer,
      programConfig: programConfig,
    }
    debug('programData', programData)

    console.log("Attempting to register the address:", selectedAccount.address)
    await entropy.register({
      programData: [programData],
      programDeployer: programModAccount,
    })

    console.log("Your address", selectedAccount.data.address, "has been successfully registered.")
  }
}
