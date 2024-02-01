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

 

    console.log({entropy})

    if (entropy.ready instanceof Promise) {
      await entropy.ready
      console.log(entropy.account)
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

      const programFor = '5D4UnQZ67EFSfBXPnyyVbyBLVwvX4bMeULrRv6ade3YVEiAe'

      const programAll = entropy.programs.get(programFor)

      console.log({programAll})
      // const pointer = await entropy.programs.dev.deploy(dummyProgram)
      // const programGetPost = await entropy.programs.get(address)

      // console.log({programGetPost})

      console.log('Attempting to register the address:', address) 
      await entropy.register({
        programModAccount: address,
        keyVisibility: 'Permissioned',
        initialPrograms: [{ programPointer: '', programConfig: '0x' }],
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
