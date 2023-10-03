import { ethers } from "ethers";
import { handleSeed, handleKeyPath } from "../../common/questions";
import { getTx } from "../../../tx";
import Entropy from "@entropyxyz/entropy-js";

export const sign = async () => {
  const seed = await handleSeed();
  const entropy = await Entropy.setup(seed);
  const name = await handleKeyPath();
  const provider = new ethers.providers.JsonRpcProvider(
    "https://goerli.infura.io/v3/204c79c0f1444b589de38493cd1bf597"
  );

  const tx = await getTx(provider, name);
  const signature = await entropy.sign(tx, false, 10);
  const signed_tx = await ethers.utils.serializeTransaction(tx, signature);

  try {
    const tx_send = await provider.sendTransaction(signed_tx);
    console.log("transaction sent successfully", { tx_send });
  } catch (e) {
    console.log({ failedTransaction: e.transaction, e });
  }
  // send signed tx tp chain
  process.exit();
};
