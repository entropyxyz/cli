import { handleSeed } from "../../common/questions";
import Entropy from "@entropyxyz/entropy-js";

export const entropyFaucet = async () => {
  // const seed = await handleSeed();
  // const entropy = await Entropy.setup(seed);
  // const entropySudo = await Entropy.setup(
  //   "0xe5be9a5092b81bca64be81d212e7f2f9eba183bb7a90954f7b76361f6edb5c0a"
  // ); // Alice key
  // const address = entropy.substrate.signer.wallet.address;
  // const tx = await entropySudo.substrate.api.tx.sudo.sudo(
  //   entropySudo.substrate.api.tx.balances.setBalance(
  //     address,
  //     "10000000000000000",
  //     "0"
  //   )
  // );
  // await entropySudo.substrate.sendAndWait(tx, false);
  // console.log(address, "funded");
  process.exit();
};
