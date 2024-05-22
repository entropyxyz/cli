import { initializeEntropy } from "../../common/initializeEntropy"

const hexToBigInt = (hexString: string) => BigInt(hexString)


export async function checkBalance ({ accounts, selectedAccount: selectedAccountAddress, endpoints }, options) {
  const endpoint = endpoints[options.ENDPOINT]
  console.log('endpoint', endpoint);
  
  const selectedAccount = accounts.find(obj => obj.address === selectedAccountAddress);
  const entropy = await initializeEntropy({ keyMaterial: selectedAccount.data }, endpoint);
  const accountAddress = selectedAccountAddress
  // @ts-ignore
  const accountInfo = (await entropy.substrate.query.system.account(accountAddress)) as any
  const freeBalance = hexToBigInt(accountInfo.data.free)
  console.log(`Address ${accountAddress} has a balance of: ${freeBalance.toString()} bits`)
}
