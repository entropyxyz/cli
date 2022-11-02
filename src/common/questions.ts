import inquirer from "inquirer";
import { getWallet } from "./entropy";
const question = [
  {
    type: "input",
    name: "mnemonic",
    message: "input mnemonic",
    default: "//Alice",
  },
];

export const handleMnemonic = async () => {
  if (process.env.MNEMONIC) {
    return process.env.MNEMONIC;
  }

  const { mnemonic } = await inquirer.prompt(question);

  return await getWallet(mnemonic);
};
