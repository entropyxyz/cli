import { handleChainEndpoint, handleUserSeed } from "../../common/questions"
import { readFileSync } from 'fs'
import { Controller } from "../../../controller"
import { getUserAddress, returnToMain } from "../../common/utils"
import { initializeEntropy } from "../../common/initializeEntropy"
import * as util from '@polkadot/util'


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
      const basicTxProgram: any = readFileSync(
        '/Users/lreyes/Desktop/Github/Entropy/SDK/tests/testing-utils/template_basic_transaction.wasm'
      )
  
    
      const pointer = await entropy.programs.dev.deploy(basicTxProgram)
      // const pointer = '0x7572505786b022118475733546a273d772b3857de537a0981c3e4a805678e3a0'
      console.log("pointer", pointer)
      const config = `
      {
          "allowlisted_addresses": [
              "0x772b9a9e8aa1c9db861c6611a82d251db4fac990"
          ]
      }
  `
      // convert to bytes 
  
      const encoder = new TextEncoder()
      const byteArray = encoder.encode(config)
  
      // convert u8a to hex
      const programConfig = util.u8aToHex(new Uint8Array(byteArray))
  
  
  
      const programData = {
        programPointer: pointer,
        programConfig: programConfig,
      }
  
  
      console.log({programData})
      // const pointer = await entropy.programs.dev.deploy(dummyProgram)
      // const programGetPost = await entropy.programs.get(address)

      // console.log({programGetPost})

      console.log('Attempting to register the address:', address) 
      await entropy.register({
        programModAccount: address,
        keyVisibility: 'Permissioned',
        initialPrograms: [programData],
        freeTx: false,
      })

      console.log("Your address", address, "has been successfully registered.")

      const removed= await entropy.programs.dev.remove(pointer)
      console.log("removed", removed)


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
