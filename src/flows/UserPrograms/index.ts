import inquirer from "inquirer"
import * as util from "@polkadot/util"
import { initializeEntropy } from "../../common/initializeEntropy"
import { debug, getSelectedAccount, print } from "../../common/utils"

export async function userPrograms ({ accounts, selectedAccount: selectedAccountAddress, endpoints }, options) {
  const endpoint = endpoints[options.ENDPOINT]
  const selectedAccount = getSelectedAccount(accounts, selectedAccountAddress)
  const actionChoice = await inquirer.prompt([
    {
      type: "list",
      name: "action",
      message: "What would you like to do?",
      choices: [
        "View My Programs",
        "Add a Program to My List",
        "Remove a Program from My List",
        "Check if Program Exists",
        "Exit to Main Menu",
      ],
    },
  ])

  const entropy = await initializeEntropy(
    { keyMaterial: selectedAccount.data },
    endpoint
  )
  
  if (!entropy.registrationManager?.signer?.pair) {
    throw new Error("Keys are undefined")
  }

  switch (actionChoice.action) {
  case "View My Programs": {
    try {
      const programs = await entropy.programs.get(entropy.keyring.accounts.registration.address)
      if (programs.length === 0) {
        print("You currently have no programs set.")
      } else {
        print("Your Programs:")
        programs.forEach((program, index) => {
          print(
            `${index + 1}. Pointer: ${
              program.programPointer
            }, Config: ${JSON.stringify(program.programConfig)}`
          )
        })
      }
    } catch (error) {
      console.error(error.message)
    }
    break
  }
  case "Check if Program Exists": {
    try {
      const { programPointer } = await inquirer.prompt([{
        type: "input",
        name: "programPointer",
        message: "Enter the program pointer you wish to check:",
        validate: (input) => (input ? true : "Program pointer is required!"),
      }])
      debug('program pointer', programPointer);
      
      const program = await entropy.programs.dev.get(programPointer);
      debug('Program from:', programPointer);
      print(program);
    } catch (error) {
      console.error(error.message);
    }
    break;
  }

  case "Add a Program to My List": {
    try {
      const { programPointerToAdd, programConfigJson } = await inquirer.prompt([
        {
          type: "input",
          name: "programPointerToAdd",
          message: "Enter the program pointer you wish to add:",
          validate: (input) => (input ? true : "Program pointer is required!"),
        },
        {
          type: "editor",
          name: "programConfigJson",
          message:
              "Enter the program configuration as a JSON string (this will open your default editor):",
          validate: (input) => {
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
  
      await entropy.programs.add(
        {
          programPointer: programPointerToAdd,
          programConfig: programConfigHex,
        },
        entropy.keyring.accounts.registration.address,
      )
  
      print("Program added successfully.")
    } catch (error) {
      console.error(error.message)
    }
    break
  }
  case "Remove a Program from My List": {
    try {
      const { programPointerToRemove } = await inquirer.prompt([
        {
          type: "input",
          name: "programPointerToRemove",
          message: "Enter the program pointer you wish to remove:",
        },
      ])
      await entropy.programs.remove(
        programPointerToRemove,
        entropy.keyring.accounts.registration.verifyingKeys?.[0]
      )
      print("Program removed successfully.")
    } catch (error) {
      console.error(error.message)
      
    }
    break
  }
  }
}
