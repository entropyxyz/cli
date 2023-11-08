import inquirer from "inquirer"
import {
  handleUserSeed,
  handleChainEndpoint,
} from "../../common/questions"
import { readFileSync } from "fs"
import { getUserAddress } from "../../common/utils"
import { buf2hex } from "../../common/utils"
import { initializeEntropy } from "../../common/initializeEntropy"
import { returnToMain } from "../../common/utils"

const preprocessAfterGet = (fetchedProgram: ArrayBuffer): ArrayBuffer => {
  const uint8View = new Uint8Array(fetchedProgram)
  const slicedView = uint8View.slice(1)
  return slicedView.buffer 
}

export const setProgram = async (): Promise<string> => {
  const seed = await handleUserSeed()
  const endpoint = await handleChainEndpoint()
  const userAddress = await getUserAddress()
  const entropy = await initializeEntropy(seed, endpoint)

  if (!entropy.keys) {
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

  if (actionChoice.action === "Exit to Main Menu") {
    console.clear()
    returnToMain()
    return 'returnToMain' 
  }

  if (actionChoice.action === "Set") {
    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "programPath",
        message: "Please provide the path to your program file:",
        validate: input => {
          if (input.trim()) return true
          return "A valid path to a program file is required!"
        },
      },
    ])

    try {
      const userProgram = readFileSync(answers.programPath)
      await entropy.programs.set(userProgram)
      console.log("Program set successfully.")
    } catch (error) {
      const message = (error instanceof Error) ? error.message : 'An unknown error occurred'
      console.error("Failed to set program:", message)
    }
  } else if (actionChoice.action === "Get") {
    try {
      console.log(userAddress)
      const fetchedProgram = await entropy.programs.get(entropy.keys.wallet.address)
      const processedProgram = preprocessAfterGet(fetchedProgram)
      const processedProgramHex = buf2hex(processedProgram)
      console.log('Retrieved program (hex):', processedProgramHex)
    } catch (error) {
      const message = (error instanceof Error) ? error.message : 'An unknown error occurred'
      console.error("Failed to get program:", message)
    }
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

  console.log('Operation completed.')
  return 'operationCompleted' 
}
