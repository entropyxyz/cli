import inquirer from "inquirer"
import { debug, accountChoices } from "../../common/utils"
import { initializeEntropy } from "../../common/initializeEntropy"

export async function register ({ accounts, endpoints, selectedAccount: selectedFromConfig }, options) {
  const endpoint = endpoints[options.ENDPOINT]

  if (!selectedFromConfig) return
  const selectedAccount = accounts.find(obj => obj.address === selectedFromConfig)
  debug('selectedAccount', selectedAccount);
  

  const entropy = await initializeEntropy({ keyMaterial: selectedAccount.data }, endpoint)

  const filteredAccountChoices = accountChoices(accounts)
  debug('filteredAccountChoices', filteredAccountChoices);

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

  const { programPointer } = await inquirer.prompt([{
    type: 'input',
    message: 'Enter the program pointer here:',
    name: 'programPointer',
    // Bare bones program? @frankie please confirm
    default: '0x6c8228950ca8dfb557d42ce11643c67ba5a3e5cee3ce7232808ea7477b846bcb'
  }])
  
  console.log("Attempting to register the address:", selectedAccount.address)
  try {
    await entropy.register({
      programDeployer: programModAccount,
      programData: [{ programPointer, programConfig: '0x' }]
    })

    console.log("Your address", selectedAccount.address, "has been successfully registered.")
  } catch (error) {
    console.error('error', error);
    const tx = await entropy.substrate.tx.registry.pruneRegistration()
    await tx.signAndSend(entropy.keyring.accounts.registration.pair, ({ status }) => {
      if (status.isFinalized) {
        console.log('Successfully pruned registration');
      }
    })
  }
}
