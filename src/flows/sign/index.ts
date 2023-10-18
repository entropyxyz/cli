import {  ethers } from "ethers";
import { handleUserSeed, handleChainEndpoint } from "../../common/questions";
import { getTx } from "../../../tx";
import { Controller } from "../../../controller";
import { returnToMain } from "../../common/utils";
import { initializeEntropy } from "../../common/initializeEntropy";

export const sign = async (controller: Controller) => {
  const seed = await handleUserSeed();
  const endpoint = await handleChainEndpoint();
  
  const entropy = await initializeEntropy(seed, endpoint);

  let address = entropy.keys?.wallet.address
  console.log({ address });
  if (address == undefined) {
    throw new Error("address issue");
  }
  const tx = await getTx()
  const serializedTx = ethers.utils.serializeTransaction(
    tx
  )
  const signature = await entropy.sign({
    sigRequestHash: serializedTx,
  })
  console.log({ signature })
  if (await returnToMain()) {
    console.clear();
    controller.emit('returnToMain');
  } else {
    controller.emit('exit');
  }
};
