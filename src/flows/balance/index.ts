import { initializeEntropy } from "../../common/initializeEntropy"
import { print, debug, getSelectedAccount } from "../../common/utils"

const hexToBigInt = (hexString: string) => BigInt(hexString)


export async function checkBalance ({ accounts, selectedAccount: selectedAccountAddress }, options) {
  const { endpoint } = options
  debug('endpoint', endpoint);
  
  const selectedAccount = getSelectedAccount(accounts, selectedAccountAddress)
  const entropy = await initializeEntropy({ keyMaterial: selectedAccount.data }, endpoint);
  const accountAddress = selectedAccountAddress
  // @ts-ignore
  const accountInfo = (await entropy.substrate.query.system.account(accountAddress)) as any
  const freeBalance = hexToBigInt(accountInfo.data.free)
  print(`Address ${accountAddress} has a balance of: ${freeBalance.toLocaleString('en-US')} BITS`)
}
