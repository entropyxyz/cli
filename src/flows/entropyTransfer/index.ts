import { handleChainEndpoint, handleUserSeed } from "../../common/questions";
import Entropy from "@entropyxyz/entropy-js";
import inquirer from "inquirer";
import { Controller } from "../../../controller";
import { returnToMain } from "../../common/utils";
import { initializeEntropy } from "../../common/initializeEntropy";

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

export const entropyTransfer = async (controller: Controller) => {
  try {
    const seed = await handleUserSeed();
    const endpoint = await handleChainEndpoint();
    
    const entropy = await initializeEntropy(seed, endpoint);

    const { amount, recipientAddress } = await inquirer.prompt(question);

    if (!entropy.keys) {
      throw new Error("Keys are undefined");
    }

    const tx = entropy.substrate.tx.balances.transfer(recipientAddress, amount);
    
    await tx.signAndSend(entropy.keys.wallet, async ({ status }) => {
      if (status.isInBlock || status.isFinalized) {
        console.log(`Sent ${amount} to ${recipientAddress}`);
      }
    });
  } catch (error: any) {
    console.error("Error in entropyTransfer:", error.message);
  } finally {
    if (await returnToMain()) {
      controller.emit('returnToMain');
    } else {
      controller.emit('exit');
    }
  }
};
