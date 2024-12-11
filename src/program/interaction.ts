import Entropy from "@entropyxyz/sdk"
import inquirer from "inquirer"
import envPaths from "env-paths"
import { join } from "node:path"
import { writeFile } from "node:fs/promises"
// import { u8aToHex } from "@polkadot/util"

import { displayPrograms, addQuestions, getProgramPointerInput, verifyingKeyQuestion } from "./utils";
import { EntropyProgram } from "./main";
import { print } from "../common/utils"
import { EntropyTuiOptions } from '../types'

let verifyingKey: string;

const paths = envPaths('entropy-cryptography', { suffix: '' })

export async function entropyProgram (entropy: Entropy, opts: EntropyTuiOptions) {
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

  if (!entropy.registrationManager?.signer?.pair) {
    throw new Error("Keys are undefined")
  }

  const program = new EntropyProgram(entropy, opts.endpoint)

  switch (actionChoice.action) {
  case "View My Programs": {
    try {
      if (!verifyingKey && entropy.keyring.accounts.registration.verifyingKeys.length) {
        ({ verifyingKey } = await inquirer.prompt(verifyingKeyQuestion(entropy)))
      } else {
        print('You currently have no verifying keys, please register this account to generate the keys')
        break
      }
      const programs = await program.list({ verifyingKey })
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
      const info = await program.get(programPointer);
      print(info);
    } catch (error) {
      console.error(error.message);
    }
    break;
  }

  case "Add a Program to My List": {
    try {
      const { programPointerToAdd, programConfigJson } = await inquirer.prompt(addQuestions)

      // NOTE: 'interaction' lets you use an editor to enter programConfigJSON (seems nice!).
      // program.add expects a path (programConfigPath). I didn't want to make a sloppy API
      // which supports maybe this maybe that, so instead write this json to a tmp file!
      const tmpPath = join(paths.temp, `config-${Date.now()}.json`)
      await writeFile(tmpPath, programConfigJson)

      await program.add({
        programPointer: programPointerToAdd,
        programConfigPath: tmpPath
      })

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
      await program.remove({ programPointer: programPointerToRemove, verifyingKey })
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
export async function entropyProgramDev (entropy, endpoint) {
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

  const flow = choices[actionChoice.action]
  await flow(entropy, endpoint)
}

async function deployProgramTUI (entropy: Entropy, endpoint: string) {
  const program = new EntropyProgram(entropy, endpoint)

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
    const pointer = await program.deploy(answers)

    print("Program deployed successfully with pointer:", pointer)
  } catch (deployError) {
    console.error("Deployment failed:", deployError)
  }
}

async function getOwnedProgramsTUI (entropy: Entropy, endpoint: string) {
  const program = new EntropyProgram(entropy, endpoint)

  try {
    const fetchedPrograms = await program.listDeployed()
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
