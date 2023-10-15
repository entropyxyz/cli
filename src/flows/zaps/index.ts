import { handleChainEndpoint, handleUserSeed } from "../../common/questions";
import Entropy from "@entropyxyz/entropy-js";
import inquirer from "inquirer";
import { main } from "../../../index";  // If you wish to return to the main menu
import { returnToMain } from "../../common/utils";

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
  const seed = await handleUserSeed();
  const endpoint = await handleChainEndpoint();
  const entropy: Entropy = new Entropy({ seed, endpoint });
  await entropy.ready;

  const { amount, account } = await inquirer.prompt(question);



  if (!entropy.keys) {
    throw new Error("Keys are undefined");
  }

  const tx = entropy.substrate.tx.freeTx.giveZaps(account, amount);
  const unsubscribe = await tx.signAndSend(
    entropy.keys.wallet,
    async ({ status }) => {
      if (status.isInBlock || status.isFinalized) {
        console.log(`${account} given ${amount} zaps`);
        
        if (await returnToMain()) {
          main();
        } else {
          process.exit();
        }
      }
    }
  );
};
