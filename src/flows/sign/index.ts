import { ethers } from "ethers";
import { handleSeed, handleChainEndpoint } from "../../common/questions";
import { getTx } from "../../../tx";
import Entropy from "@entropyxyz/entropy-js";

export const sign = async () => {
  const seed = await handleSeed();
  const endpoint = await handleChainEndpoint()
  const entropy = new Entropy({ seed, endpoint });
  await entropy.ready
  let address = entropy.keys?.wallet.address
  console.log({ address });
  if (address == undefined) {
    throw new Error("address issue");
  }
  const tx = await getTx()
  const serializedTx = ethers.utils.serializeTransaction(
    tx
  )
  const signature: any = await entropy.sign({
    sigRequestHash: serializedTx,
  })
  console.log({ signature })
  process.exit();
};
