import { SignatureLike } from "@ethersproject/bytes";
import { BigNumber, ethers } from "ethers";
import { prepTx, pollNodeForSignature } from "./helpers";
import {
  handleSeed,
  handleThresholdEndpoints,
  handleChainEndpoint,
} from "../../common/questions";
import { getWallet, getApi } from "../../common/entropy";
import { getTx } from "../../../tx";
export const sign = async () => {
  const seed = await handleSeed();
  const { wallet, pair } = await getWallet(seed);
  const thresholdEndpoints = await handleThresholdEndpoints();
  const chainEndpoint = await handleChainEndpoint();
  const api = await getApi(chainEndpoint);

  const provider = new ethers.providers.JsonRpcProvider(
    "https://goerli.infura.io/v3/204c79c0f1444b589de38493cd1bf597"
  );
  const tx = await getTx(provider);

  const sig_data = await ethers.utils.serializeTransaction(tx);
  //   console.log({ sig_data });
  const sig_hash = ethers.utils.keccak256(sig_data);

  await prepTx(api, wallet, sig_hash);

  const signature: SignatureLike = await pollNodeForSignature(
    sig_hash.slice(2),
    thresholdEndpoints[0]
  );
  const signed_tx = await ethers.utils.serializeTransaction(tx, signature);

  try {
    const tx_send = await provider.sendTransaction(signed_tx);
    console.log("transaction sent successfully", { tx_send });
  } catch (e: any) {
    console.log({ failedTransaction: e.transaction, e });
  }
  // send signed tx tp chain
  process.exit();
};
