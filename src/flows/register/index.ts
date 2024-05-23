import inquirer from "inquirer"
// TO-DO: what is this from: frankie
import { debug, getSelectedAccount, print, /*accountChoices*/ } from "../../common/utils"
import { initializeEntropy } from "../../common/initializeEntropy"

export async function register (storedConfig, options) {
  const { accounts, endpoints, selectedAccount: selectedFromConfig } = storedConfig;
  const endpoint = endpoints[options.ENDPOINT]

  if (!selectedFromConfig) return
  const selectedAccount = getSelectedAccount(accounts, selectedFromConfig)

  const entropy = await initializeEntropy({ keyMaterial: selectedAccount.data }, endpoint)
  // TO-DO: investigate this a little more
  // const filteredAccountChoices = accountChoices(accounts)

  const { programPointer } = await inquirer.prompt([{
    type: 'input',
    message: 'Enter the program pointer here:',
    name: 'programPointer',
    // Setting default to default key proxy program
    default: '0x0000000000000000000000000000000000000000000000000000000000000000'
  }])
  //@ts-ignore:
  debug('about to register selectedAccount.address' +  selectedAccount.address + 'keyring:' + entropy.keyring.getLazyLoadAccountProxy('registration').pair.address)
  print("Attempting to register the address:", selectedAccount.address, )
  let verifyingKey: string
  try {
    verifyingKey = await entropy.register({
      programDeployer: entropy.keyring.accounts.registration.address,
      programData: [{
        programPointer,
        programConfig: '0x',
      }]
    })
    if (verifyingKey) {
      print("Your address", selectedAccount.address, "has been successfully registered.")
      selectedAccount?.data?.registration?.verifyingKeys?.push(verifyingKey)
      selectedAccount?.registration?.verifyingKeys?.push(verifyingKey)
      const arrIdx = accounts.indexOf(selectedAccount)
      accounts.splice(arrIdx, 1, selectedAccount)
      return { accounts, selectedAccount: selectedAccount.address }
    }
  } catch (error) {
    console.error('error', error);
    if (!verifyingKey) {
      const tx = await entropy.substrate.tx.registry.pruneRegistration()
      await tx.signAndSend(entropy.keyring.accounts.registration.pair, ({ status }) => {
        if (status.isFinalized) {
          print('Successfully pruned registration');
        }
      })
    }
  }
}
