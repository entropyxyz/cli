import inquirer from "inquirer"
import {
  handleUserSeed,
  handleChainEndpoint,
} from "../../common/questions"
import { readFileSync } from "fs"
import { getUserAddress } from "../../common/utils"
import { Controller } from "../../../controller"
import { buf2hex } from "../../common/utils"
import { initializeEntropy } from "../../common/initializeEntropy"
import { returnToMain } from "../../common/utils"


// const preprocessAfterGet = (fetchedProgram: ArrayBuffer): ArrayBuffer => {
//   const uint8View = new Uint8Array(fetchedProgram)

//   const slicedView = uint8View.slice(1)

//   return slicedView.buffer }

  export const setProgram = async (controller: Controller) => {
    try {
      const seed = await handleUserSeed()
      const endpoint = await handleChainEndpoint()
      const userAddress = await getUserAddress()
      const entropy = await initializeEntropy(seed, endpoint)
  
      if (!entropy.account?.sigRequestKey) {
        throw new Error("Keys are undefined")
      }
  
      const actionChoice = await inquirer.prompt([
        {
          type: "list",
          name: "action",
          message: "Do you want to set or get the program?",
          choices: ["Set", "Get", "Exit to Main Menu"],
        },
      ])
  
      switch (actionChoice.action) {
        case "Set":
          const answers = await inquirer.prompt([
            {
              type: "input",
              name: "programPath",
              message: "Please provide the path to your program file:",
              validate: input => {
                if (input) return true
                else return "A valid path to a program file is required!"
              },
            },
          ])
          const userProgram: any = readFileSync(answers.programPath)
          await entropy.programs.set(userProgram)
          console.log("Program set successfully.")
          break
  
        case "Get":
          console.log(userAddress)
          const fetchedProgram = await entropy.programs.get(entropy.account.sigRequestKey.wallet.address)
          // const processedProgramHex = buf2hex(fetchedProgram)
          console.log('Retrieved program (hex):', fetchedProgram)
          break
  
        case "Exit to Main Menu":
          console.clear()
          controller.emit('returnToMain')
          break
      }
    } catch (error: any) {
      console.error("Error in setProgram:", error.message)
    } finally {
      if (await returnToMain()) {
        console.clear()
        controller.emit('returnToMain')
      }
    }
  }
  