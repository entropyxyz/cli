import inquirer from 'inquirer'
import { handleChainEndpoint, handleUserSeed } from '../../common/questions'
import { getUserAddress, returnToMain } from '../../common/utils'
import { initializeEntropy } from '../../common/initializeEntropy'
import { getWallet } from '@entropyxyz/entropy-js/src/keys'
import Entropy,  { EntropyAccount }from '@entropyxyz/entropy-js'

export const register = async (): Promise<string> => {
  try {
    const seed = await handleUserSeed()

    const signer = await getWallet(seed)

    const entropyAccount: EntropyAccount = {
      sigRequestKey: signer,
      programModKey: signer
    }

    const entropy = new Entropy({ account: entropyAccount })


    if (!entropy) {
      throw new Error("Failed to initialize Entropy")
    }

    // Wait for Entropy to be ready
    await entropy.ready

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
      await entropy.register({
        keyVisibility: 'Permissioned',
        freeTx: false,
        programModAccount: address,
      })
      console.log(`Your address ${address} has been successfully registered.`)
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
  } catch (error) {
    console.error('An error occurred:', error)
    return 'returnToMain'
  }
}
