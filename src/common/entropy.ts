import { Keyring } from "@polkadot/keyring";

export const getWallet = async (mnemonic: string) => {
  const keyring = new Keyring({ type: "sr25519" });
  return keyring.addFromUri(mnemonic);
};
