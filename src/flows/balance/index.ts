import { initializeEntropy } from "../../common/initializeEntropy"

const hexToBigInt = (hexString: string) => BigInt(hexString)


export async function checkBalance ({ accounts, selectedAccount: selectedAccountAddress, endpoints }, options) {
  const endpoint = endpoints[options.ENDPOINT]
  const selectedAccount = accounts.find(obj => obj.address === selectedAccountAddress);
  const entropy = await initializeEntropy(selectedAccount.data, endpoint);
  const accountAddress = selectedAccountAddress
  
  const accountInfo = (await entropy.substrate.query.system.account(accountAddress)) as any
  const freeBalance = hexToBigInt(accountInfo.data.free)
  console.log(`Address ${accountAddress} has a balance of: ${freeBalance.toString()} bits`)
}
