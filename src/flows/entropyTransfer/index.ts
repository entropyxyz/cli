import { handleChainEndpoint, handleUserSeed } from "../../common/questions";
import inquirer from "inquirer";
import { Controller } from "../../../controller";
import { returnToMain } from "../../common/utils";
import { initializeEntropy } from "../../common/initializeEntropy";
import { getWallet } from "@entropyxyz/sdk/dist/keys";


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
    const seed = await handleUserSeed()
    const endpoint = await handleChainEndpoint()

    
    const entropy = await initializeEntropy(seed, endpoint)

    const { amount, recipientAddress } = await inquirer.prompt(question)

    if (!entropy.account?.sigRequestKey?.pair) {
      throw new Error("Signer keypair is undefined or not properly initialized.")
    }

    const tx = await entropy.substrate.tx.balances.transferAllowDeath(recipientAddress, amount)
    
    const txHash: any = await tx.signAndSend(entropy.account.sigRequestKey.wallet, async ({ status }) => {
      if (status.isInBlock || status.isFinalized) {
        console.log(`Sent ${amount} to ${recipientAddress}`);
        return txHash
      }
    });
  } catch (error: any) {
    console.error("Error in entropyTransfer:", error.message);
  } finally {
    if (await returnToMain()) {
      console.clear();
      controller.emit('returnToMain');
    } else {
      controller.emit('exit');
    }
  }
};
