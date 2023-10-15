import { handleChainEndpoint, handleUserSeed } from "../../common/questions";
import Entropy from "@entropyxyz/entropy-js";
import inquirer from "inquirer";
import { main } from "../../../index";  
import { returnToMain } from "../../common/utils";

const question = [
  {
    type: "input",
    name: "amount",
    message: "Input amount to transfer:",
    default: "1",
  },
  {
    type: "input",
    name: "recipientAddress",
    message: "Input recipient's address:",
    default: "5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY",
  },
];

export const entropyTransfer = async () => {
  const seed = await handleUserSeed();
  const endpoint = await handleChainEndpoint();
  const entropy: Entropy = new Entropy({ seed, endpoint });
  await entropy.ready;

  const { amount, recipientAddress } = await inquirer.prompt(question);

  if (!entropy.keys) {
    throw new Error("Keys are undefined");
  }

  const tx = entropy.substrate.tx.balances.transfer(recipientAddress, amount);
  
  await tx.signAndSend(entropy.keys.wallet, async ({ status }) => {
    if (status.isInBlock || status.isFinalized) {
      console.log(`Sent ${amount} to ${recipientAddress}`);
      
      if (await returnToMain()) {
        main();
      } else {
        process.exit();
      }
    }
  });
};
