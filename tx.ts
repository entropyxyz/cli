import { BigNumber, ethers } from "ethers";

export const getTx = async (provider: any) => {
  // need to get address from stored tofn keys
  const entropyAddress = "0x84abf76158Dfb35F52B754707Ebe026ebA4b11A4";
  const nonce = await provider.getTransactionCount(entropyAddress);
  const feeData = await provider.getFeeData();

  const tx: ethers.utils.UnsignedTransaction = {
    to: "0x772b9a9e8aa1c9db861c6611a82d251db4fac990",
    value: BigNumber.from("1"),
    chainId: provider.network.chainId,
    nonce,
	data: ethers.utils.hexlify(ethers.utils.toUtf8Bytes("Created On Entropy")),
    type: 2,
  };

  if (feeData.maxFeePerGas) {
    tx.maxFeePerGas = feeData.maxFeePerGas;
  }

  if (feeData.maxPriorityFeePerGas) {
    tx.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas;
  }

  const gasLimit = await provider.estimateGas(tx)

  tx.gasLimit = gasLimit

  return tx;
};
