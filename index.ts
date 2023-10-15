import inquirer, { ListQuestion } from "inquirer";
import { ascii } from "./src/common/ascii";
import * as flows from "./src/flows";

const choices = [
  "Transfer",
  "Register",
  "Set a Program",
  "Sign",
  "Entropy Faucet",
  "New Entropy Wallet",
  "Give Zaps",
];

const intro: ListQuestion = {
  type: "list",
  name: "action",
  message: "Select Action",
  pageSize: choices.length,
  choices: choices,
};



export const main = async () => {
  console.log(ascii)

  const { action } = await inquirer.prompt(intro);
  switch (action) {
    case "Transfer":
      await flows.entropyTransfer();
      break;
    case "Register":
      await flows.register();
      break;
    case "Set Program":
        await flows.setProgram();
        break;
    case "Sign":
      await flows.sign();
      break;
    case "Entropy Faucet":
      await flows.entropyFaucet();
      break;
    case "New Entropy Wallet":
      await flows.newWallet();
      break;
    case "Give Zaps":
      await flows.giveZaps();
      break;
    default:
      throw new Error("invalid choice");
  }
};

main();
