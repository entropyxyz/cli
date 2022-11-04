import * as dotenv from "dotenv";
dotenv.config();
import inquirer, { ListQuestion } from "inquirer";
import * as flows from "./src/flows";

const choices = ["Register", "Sign", "Entropy Faucet"];

const intro: ListQuestion = {
  type: "list",
  name: "action",
  message: "Select Action",
  pageSize: choices.length,
  choices: choices,
};

const main = async () => {
  const { action } = await inquirer.prompt(intro);
  switch (action) {
    case "Register":
      await flows.register();
      break;
    case "Sign":
      await flows.sign();
      break;
    case "Entropy Faucet":
      await flows.entropyFaucet();
      break;
    default:
      throw new Error("invalid choice");
  }
};

main();
