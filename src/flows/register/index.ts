import { handleMnemonic, handleThresholdEndpoints, handleChainEndpoint } from "../../common/questions";
import { getWallet } from "../../common/entropy";

export const register = async () => {
  const mnemonic = await handleMnemonic();
  const wallet = await getWallet(mnemonic);
  const thresholdEndpoints = await handleThresholdEndpoints()
  const chainEndpoint = await handleChainEndpoint()
  console.log({ wallet, thresholdEndpoints, chainEndpoint });
};
