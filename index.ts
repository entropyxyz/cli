import inquirer, { ListQuestion } from "inquirer";
import { ascii } from "./src/common/ascii";
import * as flows from "./src/flows";

const choices = [
  "Transfer",
  "Register",
  "Programs",
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
  console.log(ascii);


  const { action } = await inquirer.prompt(intro);
  switch (action) {
    case "Transfer":
      await flows.entropyTransfer();
      return;
      
    case "Register":
      await flows.register();
      return;
      
    case "Programs":
      await flows.setProgram();
      return;
      
    case "Sign":
      await flows.sign();
      return;
      
    case "Entropy Faucet":
      await flows.entropyFaucet();
      return;
      
    case "New Entropy Wallet":
      await flows.newWallet();
      return;
      
    case "Give Zaps":
      await flows.giveZaps();
    return;

    default:
      console.warn(`Received an unexpected action: "${action}"`);
      return;
  }
};

main();
