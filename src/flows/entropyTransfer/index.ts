import {
  handleUserSeed,
  handleChainEndpoint,
  handleFundingSeed,
} from "../../common/questions";
import Entropy from "@entropyxyz/entropy-js";
import { getUserAddress } from "../../common/utils";
import { main } from "../../../index";
import { returnToMain } from "../../common/utils";


export const entropyTransfer = async () => {
  const recipientAddress = await getUserAddress();
  const seed = await handleFundingSeed();
  const endpoint = await handleChainEndpoint();
  const entropy = new Entropy({ seed, endpoint });

  await entropy.ready;

  if (!entropy.keys) {
    throw new Error("Keys are undefined");
  }

  const address = entropy.keys.wallet.address;
  console.log("ADDRESS", address);
  const amount = "10000000000000000";
  const tx = entropy.substrate.tx.balances.transfer(recipientAddress, amount);

  const unsubscribe = await tx.signAndSend(
    entropy.keys.wallet,
    async ({ status }) => {  
      if (status.isInBlock || status.isFinalized) {
        console.log(address, "funded");
  
        if (await returnToMain()) {
          main();
      } else {
          console.log("Goodbye!");
          process.exit();
      }
      }
    }
  );
  }  