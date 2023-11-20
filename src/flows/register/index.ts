import inquirer from 'inquirer'
import { handleChainEndpoint, handleUserSeed } from '../../common/questions'
import { getUserAddress, returnToMain } from '../../common/utils'
import { initializeEntropy } from '../../common/initializeEntropy'

export const register = async (): Promise<string> => {
  const seed = await handleUserSeed()
  const endpoint = await handleChainEndpoint()
  const entropy = await initializeEntropy(seed, endpoint)

  if (entropy.ready instanceof Promise) {
    await entropy.ready
  }

  const address = await getUserAddress()
  if (!address) {
    throw new Error("Address issue") 
  }

  console.log('Checking registration status for address:', address)

  const isRegistered = await entropy.registrationManager.checkRegistrationStatus(address)

  if (isRegistered) {
    console.log('Address is already registered:', address)
  } else {
    console.log('Attempting to register the address:', address)
    // await entropy.register({
    //   address,
    //   keyVisibility: 'Permissioned',
    //   freeTx: false,
    // })
    // console.log(`Your address ${address} has been successfully registered.`)
  }
  const { continueToMain } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'continueToMain',
      message: 'Press enter to return to the main menu...',
      default: true,
    },
  ])

  if (continueToMain) {
    returnToMain()
    return 'returnToMain' 
  }

  process.exit()
}
