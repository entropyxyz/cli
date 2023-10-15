import { recoverAddress } from "ethers/lib/utils";
import { handleChainEndpoint, handleFundingSeed, handleUserSeed } from "../../common/questions";
import { getUserAddress } from "../../common/utils";
import Entropy from "@entropyxyz/entropy-js";
import { main } from "../../..";
import { returnToMain } from "../../common/utils";

export const entropyFaucet = async (recipientAddress: string | null | undefined = null) => {
  const endpoint = await handleChainEndpoint();

  if (!recipientAddress) {
    recipientAddress = await getUserAddress();
    if (!recipientAddress) {
      throw new Error("Failed to retrieve the recipient address.");
    }
  }

  const seed = await handleFundingSeed();
  const entropy = new Entropy({seed, endpoint});
  await entropy.ready;

  console.log("FUNDINGADDRESS:", entropy.keys?.wallet.address)
  console.log("RECIPIENT ADDRESS", recipientAddress)

  if (!entropy.keys) {
    throw new Error("No keys found in the entropy object.");
  }

  const funderAddress = entropy.keys.wallet.address;
  if (!funderAddress) {
    throw new Error("Unable to extract address from funding seed.");
  }

  const amountToFund = "100000000"; 
  const tx = entropy.substrate.tx.balances.forceSetBalance(recipientAddress, amountToFund);

  await tx.signAndSend(entropy.keys.wallet, ({ status }) => { 
    if (status.isInBlock || status.isFinalized) {
      console.log(recipientAddress, "funded");
      process.exit();
    }
  });
  if (await returnToMain()) {
    main();
} else {
    process.exit();
}
}

