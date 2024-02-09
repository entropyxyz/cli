import inquirer from "inquirer"
import {
  handleUserSeed,
  handleChainEndpoint,
} from "../../common/questions"

import { Controller } from "../../../controller"
import { initializeEntropy } from "../../common/initializeEntropy"
import { returnToMain } from "../../common/utils"
import * as util from '@polkadot/util'

export const userPrograms = async (controller: Controller) => {
  try {
    const seed = await handleUserSeed()
    const endpoint = await handleChainEndpoint()
    const entropy = await initializeEntropy(seed, endpoint)
  
    if (!entropy.account?.sigRequestKey) {
      throw new Error("Keys are undefined")
    }

    const actionChoice = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: "What would you like to do?",
        choices: ["View My Programs", "Add a Program to My List", "Remove a Program from My List", "Exit to Main Menu"],
      },
    ])

    switch (actionChoice.action) {
    case "View My Programs": {
      const programs = await entropy.programs.get(entropy.account.sigRequestKey.wallet.address)
      if (programs.length === 0) {
        console.log("You currently have no programs set.")
      } else {
        console.log("Your Programs:")
        programs.forEach((program, index) => {
          console.log(`${index + 1}. Pointer: ${program.programPointer}, Config: ${JSON.stringify(program.programConfig)}`)
        })
      }
      break
    }

    case "Add a Program to My List": {
      const { programPointerToAdd, programConfigJson } = await inquirer.prompt([
        {
          type: "input",
          name: "programPointerToAdd",
          message: "Enter the program pointer you wish to add:",
          validate: input => input ? true : "Program pointer is required!",
        },
        {
          type: "editor",
          name: "programConfigJson",
          message: "Enter the program configuration as a JSON string (this will open your default editor):",
          validate: input => {
            try {
              JSON.parse(input)
              return true
            } catch (e) {
              return "Please enter a valid JSON string for the configuration."
            }
          },
        },
      ])

      const encoder = new TextEncoder()
      const byteArray = encoder.encode(programConfigJson)
      const programConfigHex = util.u8aToHex(byteArray)

      await entropy.programs.add({
        programPointer: programPointerToAdd,
        programConfig: programConfigHex
      }, entropy.account.sigRequestKey.wallet.address)

      console.log("Program added successfully.")
      break
    }
    case "Remove a Program from My List": {
      const { programPointerToRemove } = await inquirer.prompt([
        {
          type: "input",
          name: "programPointerToRemove",
          message: "Enter the program pointer you wish to remove:",
        },
      ])
      await entropy.programs.remove(programPointerToRemove, entropy.account.sigRequestKey.wallet.address)
      console.log("Program removed successfully.")
      break
    }
    case "Exit to Main Menu": {
      console.clear()
      controller.emit('returnToMain')
      break
    }
    }
  } catch (error) {
    console.error("Error managing user programs:", error)
  } finally {
    if (await returnToMain()) {
      console.clear()
      controller.emit('returnToMain')
    }
  }
}