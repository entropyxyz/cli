import inquirer from "inquirer";
import { accountChoices } from "../../common/utils";

export async function selectAccount ({ accounts }) {
  const accountQuestion = {
    type: "list",
    name: "selectedAccount",
    message: "Choose account:",
    choices: accountChoices(accounts) 
  }

  const answers = await inquirer.prompt([accountQuestion])

  return { selectedAccount: answers.selectedAccount.address }
}