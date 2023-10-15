import { handleUserSeed } from "../../common/questions";
import Entropy from "@entropyxyz/entropy-js";
import inquirer from "inquirer";

const question = [
  {
    type: "input",
    name: "amount",
    message: "input amount of free zaps to give",
    default: "1",
  },
  {
    type: "input",
    name: "account",
    message: "input account to give free zaps to",
    default: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
  },
];

export const giveZaps = async () => {
  throw new Error("TODO")
  // const seed = await handleSeed();
  // const { amount, account } = await inquirer.prompt(question);

  // const entropy: Entropy = await Entropy.setup(seed);
  // const tx = await entropy.substrate.api.tx.freeTx.giveZaps(account, amount);
  // const sudoCall = entropy.substrate.api.tx.sudo.sudo(tx);
  // await entropy.substrate.sendAndWait(sudoCall, false);
  // console.log(`${account} given ${amount} zaps`);
  process.exit();
};
