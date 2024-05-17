import Entropy from "@entropyxyz/sdk"
import * as util from "@polkadot/util"
import inquirer from "inquirer"
import { initializeEntropy } from "../../common/initializeEntropy"
import { debug, accountChoices } from "../../common/utils"
import { readFileSync } from "fs"

export async function devPrograms ({ accounts, endpoints }, options) {
  const endpoint = endpoints[options.ENDPOINT]
  const accountQuestion = {
    type: "list",
    name: "selectedAccount",
    message: "Choose account:",
    choices: accountChoices(accounts) 
  }

  const answers = await inquirer.prompt([accountQuestion])
  const selectedAccount = answers.selectedAccount
  debug('selectedAccount:', {selectedAccount})

  const choices = {
    "Deploy": deployProgram,
    "Get Program Pointers": getProgramPointers,
    "Exit": () => console.log("Exiting")
  }

  const actionChoice = await inquirer.prompt([
    {
      type: "list",
      name: "action",
      message: "Select your action:",
      choices: Object.keys(choices)
    },
  ])

  const entropy = await initializeEntropy(
    { data: selectedAccount.data },
    endpoint
  )
  
  const flow = choices[actionChoice.action]
  await flow(entropy, selectedAccount)
}

async function deployProgram (entropy: Entropy, account: any) {
  const deployQuestions = [
    {
      type: "input",
      name: "programPath",
      message: "Please provide the path to your program:",
    },
    {
      type: "confirm",
      name: "hasConfig",
      message: "Does your program have a configuration file?",
      default: false,
    },
  ]

  const deployAnswers = await inquirer.prompt(deployQuestions)
  const userProgram = readFileSync(deployAnswers.programPath)

  let programConfig = ""

  if (deployAnswers.hasConfig) {
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

  try {
    // Deploy the program with config
    const pointer = await entropy.programs.dev.deploy(
      userProgram,
      programConfig
    )
    console.log("Program deployed successfully with pointer:", pointer)
  } catch (deployError) {
    console.error("Deployment failed:", deployError)
  }

  console.log("Deploying from account:", account.address)
}

async function getProgramPointers (entropy: Entropy, account: any) {
  const userAddress = account.address
  debug('Account address:',userAddress)
  if (!userAddress) return

  try {
    const fetchedProgram = await entropy.programs.get(userAddress)
    console.log("Retrieved program pointers:", fetchedProgram)
  } catch (error) {
    console.error("Failed to retrieve program pointers:", error)
  }
}
