import Entropy from "@entropyxyz/sdk"
import inquirer from "inquirer"
import { u8aToHex } from "@polkadot/util"

import { deployProgram } from "./deploy";
import { addProgram } from "./add";
import { viewPrograms } from "./view";
import { removeProgram } from "./remove";
import { addQuestions, getProgramPointerInput, verifyingKeyQuestion } from "./helpers/questions";
import { displayPrograms } from "./helpers/utils";
import { initializeEntropy } from "../../common/initializeEntropy"
import { getSelectedAccount, print } from "../../common/utils"
import { EntropyLogger } from "../../common/logger";
import { EntropyTuiOptions } from "../../types"

let verifyingKey: string;

export async function userPrograms ({ accounts, selectedAccount: selectedAccountAddress }, options: EntropyTuiOptions, logger: EntropyLogger) {
  const FLOW_CONTEXT = 'PROGRAMS'
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
      const program = await entropy.programs.dev.getProgramInfo(programPointer);
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
      const programConfigHex = u8aToHex(byteArray)

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

// eslint-disable-next-line
export async function devPrograms ({ accounts, selectedAccount: selectedAccountAddress }, options: EntropyTuiOptions, logger: EntropyLogger) {
  // const FLOW_CONTEXT = 'PROGRAMS'
  const { endpoint } = options
  const selectedAccount = getSelectedAccount(accounts, selectedAccountAddress)

  const choices = {
    "Deploy": deployProgramTUI,
    "Get Owned Programs": getOwnedProgramsTUI,
    "Exit to Main Menu": () => 'exit'
  }

  const actionChoice = await inquirer.prompt([
    {
      type: "list",
      name: "action",
      message: "Select your action:",
      choices: Object.keys(choices)
    },
  ])

  const entropy = await initializeEntropy({
    keyMaterial: selectedAccount.data,
    endpoint
  })

  const flow = choices[actionChoice.action]
  await flow(entropy, selectedAccount)
}

async function deployProgramTUI (entropy: Entropy, account: any) {
  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "bytecodePath",
      message: "Please provide the path to your program binary:",
      validate (input: string) {
        return input.endsWith('.wasm')
          ? true
          : 'program binary must be .wasm file'
      }
    },
    {
      type: "input",
      name: "configurationSchemaPath",
      message: "Please provide the path to your configuration schema:",
      validate (input: string) {
        return input.endsWith('.json')
          ? true
          : 'configuration schema must be a .json file'
      }
    },
    {
      type: "input",
      name: "auxillaryDataSchemaPath",
      message: "Please provide the path to your auxillary data schema:",
      validate (input: string) {
        return input.endsWith('.json')
          ? true
          : 'configuration schema must be a .json file'
      }
    },
  ])

  try {
    const pointer = await deployProgram(entropy, answers)

    print("Program deployed successfully with pointer:", pointer)
  } catch (deployError) {
    console.error("Deployment failed:", deployError)
  }

  print("Deploying from account:", account.address)
}

async function getOwnedProgramsTUI (entropy: Entropy, account: any) {
  const userAddress = account.address
  if (!userAddress) return

  try {
    const fetchedPrograms = await entropy.programs.dev.get(userAddress)
    if (fetchedPrograms.length) {
      print("Retrieved program pointers:")
      print(fetchedPrograms)
    } else {
      print("There are no programs to show")
    }
  } catch (error) {
    console.error("Failed to retrieve program pointers:", error)
  }
}
