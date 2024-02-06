import inquirer from "inquirer"
import { handleUserSeed, handleChainEndpoint } from "../../common/questions"
import { readFileSync } from "fs"
import { getUserAddress } from "../../common/utils"
import { Controller } from "../../../controller"
import { initializeEntropy } from "../../common/initializeEntropy"
import { returnToMain } from "../../common/utils"
import * as util from '@polkadot/util'

export const devPrograms = async (controller: Controller) => {
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
        message: "Do you want to deploy a new program or get existing program pointers?",
        choices: ["Deploy", "Get Program Pointers", "Exit to Main Menu"],
      },
    ])

    switch (actionChoice.action) {
      case "Deploy":
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
          {
            type: "confirm",
            name: "hasConfig",
            message: "Does your program have a configuration?",
            default: false,
          },
        ])

        const userProgram: any = readFileSync(answers.programPath)
        let programConfig = ''

        if (answers.hasConfig) {
          const configAnswers = await inquirer.prompt([
            {
              type: "input",
              name: "config",
              message: "Please provide your program configuration as a JSON string:",
            },
          ])

          // Convert JSON string to bytes and then to hex
          const encoder = new TextEncoder()
          const byteArray = encoder.encode(configAnswers.config)
          programConfig = util.u8aToHex(new Uint8Array(byteArray))
        }

        const pointer = await entropy.programs.dev.deploy(userProgram, programConfig)
        console.log("Program deployed successfully with pointer:", pointer)
        break

      case "Get Program Pointers":
        console.log(userAddress)
        if (!userAddress) return
        const fetchedProgram = await entropy.programs.get(userAddress)
        console.log('Retrieved program pointers:', fetchedProgram)
        break

      case "Exit to Main Menu":
        console.clear()
        controller.emit('returnToMain')
        break
    }
  } catch (error) {
    console.error("Error in setProgram:", error)
  } finally {
    if (await returnToMain()) {
      console.clear()
      controller.emit('returnToMain')
    }
  }
}
