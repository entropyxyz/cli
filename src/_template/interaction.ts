import inquirer from "inquirer";
import Entropy from "@entropyxyz/sdk";

import { EntropyDance } from './main'
import { loadByteCode, loadDanceConfig } from './utils'
import { print } from "../common/utils"

import {
  learnDanceQuestions,
  addDanceQuestions,
} from "./utils"

export async function entropyDance (entropy: Entropy, endpoint: string) {
  const dance = new EntropyDance(entropy, endpoint)
  const { action } = await inquirer.prompt([
    {
      type: "list",
      name: "action",
      message: "What would you like to do?",
      choices: [
        "Learn a dance",
        "Add an existing dance to my account",
        "Exit"
      ],
    },
  ])


  switch (action) {

  case 'Learn a dance': {
    const { danceMoveByteCodePath } = await inquirer.prompt(learnDanceQuestions)
    const danceMoveByteCode = await loadByteCode(danceMoveByteCodePath)

    await dance.learn(danceMoveByteCode)

    print('dance learnt!')
    return
  }

  case 'Add an existing dance to my account': {
    // example code. users should probably select which vk they want to use
    const verifyingKey = entropy.keyring.accounts.registration.verifyingKeys[0]
    const { dancePointer, danceConfigPath } = await inquirer.prompt(addDanceQuestions)
    const danceConfig = await loadDanceConfig(danceConfigPath)

    await dance.add(verifyingKey, dancePointer, danceConfig)

    print('Dance added to account!')
    return
  }

  case 'exit': {
    return 'exit'
  }

  default:
    throw new Error('DanceError: Unknown interaction action')
  }
}
