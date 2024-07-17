import inquirer from "inquirer"
import * as util from "@polkadot/util"
import { initializeEntropy } from "../../common/initializeEntropy"
import { getSelectedAccount, print } from "../../common/utils"
import { EntropyLogger } from "src/common/logger";
import { addProgram } from "./add";
import { viewPrograms } from "./view";
import { addQuestions, getProgramPointerInput, verifyingKeyQuestion } from "./helpers/questions";
import { displayPrograms } from "./helpers/utils";
import { removeProgram } from "./remove";

let verifyingKey: string;

export async function userPrograms ({ accounts, selectedAccount: selectedAccountAddress }, options, logger: EntropyLogger) {
  const FLOW_CONTEXT = 'USER_PROGRAMS'
  const { endpoint } = options
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

  const entropy = await initializeEntropy({ 
    keyMaterial: selectedAccount.data,
    endpoint
  })
  
  if (!entropy.registrationManager?.signer?.pair) {
    throw new Error("Keys are undefined")
  }

  switch (actionChoice.action) {
  case "View My Programs": {
    try {
      if (!verifyingKey && entropy.keyring.accounts.registration.verifyingKeys.length) {
        ({ verifyingKey } = await inquirer.prompt(verifyingKeyQuestion(entropy)))
      } else {
        print('You currently have no verifying keys, please register this account to generate the keys')
        break
      }
      const programs = await viewPrograms(entropy, { verifyingKey })
      if (programs.length === 0) {
        print("You currently have no programs set.")
      } else {
        print("Your Programs:")
        displayPrograms(programs)
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
      logger.debug(`program pointer: ${programPointer}`, `${FLOW_CONTEXT}::PROGRAM_PRESENCE_CHECK`);
      const program = await entropy.programs.dev.get(programPointer);
      print(program);
    } catch (error) {
      console.error(error.message);
    }
    break;
  }

  case "Add a Program to My List": {
    try {
      const { programPointerToAdd, programConfigJson } = await inquirer.prompt(addQuestions)
    
      const encoder = new TextEncoder()
      const byteArray = encoder.encode(programConfigJson)
      const programConfigHex = util.u8aToHex(byteArray)
    
      await addProgram(entropy, { programPointer: programPointerToAdd, programConfig: programConfigHex })
    
      print("Program added successfully.")
    } catch (error) {
      console.error(error.message)
    }
    break
  }
  case "Remove a Program from My List": {
    try {
      if (!verifyingKey) {
        ({ verifyingKey } = await inquirer.prompt(verifyingKeyQuestion(entropy)))
      }
      const { programPointer: programPointerToRemove } = await inquirer.prompt(getProgramPointerInput)
      await removeProgram(entropy, { programPointer: programPointerToRemove, verifyingKey })
      print("Program removed successfully.")
    } catch (error) {
      console.error(error.message)
    }
    break
  }
  case 'Exit to Main Menu':
    return 'exit'
  }
}