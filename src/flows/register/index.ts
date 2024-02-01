import { handleChainEndpoint, handleUserSeed } from "../../common/questions"
import { readFileSync } from 'fs'
import { Controller } from "../../../controller"
import { getUserAddress, returnToMain } from "../../common/utils"
import { initializeEntropy } from "../../common/initializeEntropy"

export const register = async (controller: Controller) => {
  try {
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

      if (await returnToMain()) {
        console.clear()
        controller.emit('returnToMain')
        return 
      }
    } else {
      const dummyProgram: any = readFileSync(
        '/Users/lreyes/Desktop/Github/Entropy/SDK/tests/testing-utils/template_barebones.wasm'
      )
  
      console.log('program deploy')
  
      const pointer = await entropy.programs.dev.deploy(dummyProgram)

      console.log('Attempting to register the address:', address) 
      await entropy.register({
        programModAccount: address,
        keyVisibility: 'Permissioned',
        initialPrograms: [{ programPointer: pointer, programConfig: '0x' }],
        freeTx: false,
      })
      console.log("Your address", address, "has been successfully registered.")

      if (await returnToMain()) {
        console.clear()
        controller.emit('returnToMain')
        return 
      }
    }
  } catch (error) {
    console.error("Error:", error)

    if (await returnToMain()) {
      console.clear()
      controller.emit('returnToMain')
      return 
    }
  }
  controller.emit('exit')
}
