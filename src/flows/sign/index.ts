import { SignatureLike } from "@ethersproject/bytes";
import { BigNumber, ethers } from "ethers";
import { prepTx, pollNodeForSignature } from "./helpers";
import {
  handleSeed,
  handleThresholdEndpoints,
  handleChainEndpoint,
} from "../../common/questions";
import { getWallet, getApi } from "../../common/entropy";

export const sign = async () => {
  const seed = await handleSeed();
  const { wallet, pair } = await getWallet(seed);
  const thresholdEndpoints = await handleThresholdEndpoints();
  const chainEndpoint = await handleChainEndpoint();
  const api = await getApi(chainEndpoint);

  const provider = new ethers.providers.JsonRpcProvider(
    "https://goerli.infura.io/v3/204c79c0f1444b589de38493cd1bf597"
  );
  const feeData = await provider.getFeeData();
  const nonce = await provider.getTransactionCount("0x84abf76158Dfb35F52B754707Ebe026ebA4b11A4")
  const tx: ethers.utils.UnsignedTransaction = {
    to: "0x772b9a9e8aa1c9db861c6611a82d251db4fac990",
    value: BigNumber.from("1"),
    chainId: provider.network.chainId,
    gasPrice: BigNumber.from("30000000000"),
    gasLimit: BigNumber.from("51000"),
    nonce,
    data: ethers.utils.hexlify(ethers.utils.toUtf8Bytes("Created On Entropy")),
    // changed type for ease to hardcode gas for now
    type: 0,
  };

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
