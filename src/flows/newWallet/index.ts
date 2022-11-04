import {
	mnemonicGenerate,
	mnemonicToMiniSecret,
	mnemonicValidate,
	ed25519PairFromSecret,
	randomAsU8a,
	randomAsHex
  } from '@polkadot/util-crypto';
  import {u8aToString} from "@polkadot/util"
  import { Keyring } from "@polkadot/api";

export const newWallet = async () => {
	const seed: any = randomAsHex(32);
	const keyring = new Keyring({ type: "sr25519" });

	const wallet = keyring.addFromSeed(seed);
	console.log("take the seed and add it to the .env", {wallet: wallet.address, seed})


}
