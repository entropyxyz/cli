// import inquirer from "inquirer"
import { getSelectedAccount, print, /*accountChoices*/ } from "../../common/utils"
import { initializeEntropy } from "../../common/initializeEntropy"
import { EntropyLogger } from "src/common/logger";
import { register } from "./register";

export async function entropyRegister (storedConfig, options, logger: EntropyLogger) {
  const FLOW_CONTEXT = 'REGISTER'
  const { accounts, selectedAccount: selectedFromConfig } = storedConfig;
  const { endpoint } = options

  if (!selectedFromConfig) return
  const selectedAccount = getSelectedAccount(accounts, selectedFromConfig)

  const entropy = await initializeEntropy({ keyMaterial: selectedAccount.data, endpoint })
  // TO-DO: investigate this a little more
  // const filteredAccountChoices = accountChoices(accounts)
  // Not going to ask for a pointer from the user just yet
  // const { programPointer } = await inquirer.prompt([{
  //   type: 'input',
  //   message: 'Enter the program pointer here:',
  //   name: 'programPointer',
  //   // Setting default to default key proxy program
  //   default: '0x0000000000000000000000000000000000000000000000000000000000000000'
  // }])
  // @ts-expect-error: Expecting error here as method expects typeof ChildKey enum from sdk
  // export from sdk is not working as intended currently
  logger.debug('about to register selectedAccount.address' +  selectedAccount.address + 'keyring:' + entropy.keyring.getLazyLoadAccountProxy('registration').pair.address, FLOW_CONTEXT)
  print("Attempting to register the address:", selectedAccount.address, )

  try {
    const verifyingKey = await register(entropy)
    print("Your address", selectedAccount.address, "has been successfully registered.")
    selectedAccount?.data?.registration?.verifyingKeys?.push(verifyingKey)
    const arrIdx = accounts.indexOf(selectedAccount)
    accounts.splice(arrIdx, 1, selectedAccount)
    return { accounts, selectedAccount: selectedAccount.address }
  } catch (error) {
    logger.error('There was a problem registering', error)
  }
}
