import { BigNumber, ethers } from "ethers";
type Network = {
  chainId: number;
}
type Provider = {
  getTransactionCount: (address: string) => Promise<number>;
  estimateGas: (tx: ethers.utils.UnsignedTransaction) => Promise<number>;
  getFeeData: () => Promise<{
    maxFeePerGas?: BigNumber;
    maxPriorityFeePerGas?: BigNumber;
  }>
  network: Network
}

export const getTx = async (provider: Provider, name: string) => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const address = require(`./tofn/${name.toLowerCase()}/address.json`);
  // need to get address from stored tofn keys
  const entropyAddress = address.address;
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

  const gasLimit = await provider.estimateGas(tx);

  tx.gasLimit = gasLimit;

  return tx;
};
