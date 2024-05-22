import inquirer from "inquirer"
import { debug, accountChoices } from "../../common/utils"
import { initializeEntropy } from "../../common/initializeEntropy"

export async function register (storedConfig, options) {
  const { accounts, endpoints, selectedAccount: selectedFromConfig } = storedConfig;
  const endpoint = endpoints[options.ENDPOINT]

  if (!selectedFromConfig) return
  const selectedAccount = accounts.find(obj => obj.address === selectedFromConfig)

  const entropy = await initializeEntropy({ keyMaterial: selectedAccount.data }, endpoint)

  const filteredAccountChoices = accountChoices(accounts)

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
    // Setting default to default key proxy program
    default: '0x0000000000000000000000000000000000000000000000000000000000000000'
  }])
  
  console.log("Attempting to register the address:", selectedAccount.address)
  try {
    const verifyingKey = await entropy.register({
      programDeployer: selectedAccount.address,
      programData: [{
        programPointer,
        programConfig: '0x',
      }]
    })
    if (verifyingKey) {
      console.log("Your address", selectedAccount.address, "has been successfully registered.")
      selectedAccount.data.registration.verifyingKeys.push(verifyingKey)
      selectedAccount.registration.verifyingKeys.push(verifyingKey)
      const arrIdx = accounts.indexOf(selectedAccount)
      accounts.splice(arrIdx, 1, selectedAccount)
      return { accounts, selectedAccount: selectedAccount.address }
    }
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
