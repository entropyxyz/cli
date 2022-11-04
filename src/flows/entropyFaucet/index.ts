import { getWallet, getApi, sendAndWait } from "../../common/entropy";
import { handleChainEndpoint, handleSeed } from "../../common/questions";
import { Keyring } from "@polkadot/api";

export const entropyFaucet = async () => {
  const seed = await handleSeed();
  const { wallet, pair } = await getWallet(seed);
  const chainEndpoint = await handleChainEndpoint();
  const api = await getApi(chainEndpoint);
  const keyring = new Keyring({ type: "sr25519" });
  const sudo = keyring.addFromUri("//Alice");
  const tx = await api.tx.sudo.sudo(
    api.tx.balances.setBalance(wallet.address, "100000000000000", "0")
  );
  await sendAndWait(tx, api, sudo);
  console.log(wallet.address, "funded");
  process.exit();
};
