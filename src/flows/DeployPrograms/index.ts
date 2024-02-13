import inquirer from "inquirer"
import { initializeEntropy } from "../../common/initializeEntropy"
import { accountChoices } from "../../common/utils"
import { readFileSync } from "fs"
import * as util from "@polkadot/util"

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
  console.log('selectedAccount:', {selectedAccount})


  const actionChoice = await inquirer.prompt ([
    {
      type: "list",
      name: "action",
      message: "Select your action:",
      choices: ["Deploy", "Get Program Pointers", "Exit"],
    },
  ])

  const entropy = await initializeEntropy({data: selectedAccount.data}, endpoint)

  switch (actionChoice.action) {
  case "Deploy":
    await deployProgram(entropy, selectedAccount)
    break
  case "Get Program Pointers":
    await getProgramPointers(entropy, selectedAccount)
    break
  case "Exit":
    console.log("Exiting.")
    break
  }
}

async function deployProgram (entropy, account) {
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

  console.log(`Deploying from account: ${account.address}`)
}

async function getProgramPointers (entropy, account) {
  const userAddress = account.address
  console.log(userAddress)
  if (!userAddress) return

  try {
    const fetchedProgram = await entropy.programs.get(userAddress)
    console.log("Retrieved program pointers:", fetchedProgram)
  } catch (error) {
    console.error("Failed to retrieve program pointers:", error)
  }
}

// function accountChoices (accounts) {
//   return accounts
//     .map((account) => ({
//       name: `${account.name} (${account.address})`,
//       value: account,
//     }))
//     .concat([{ name: "Other", value: null }])
// }
