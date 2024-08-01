import Entropy from "@entropyxyz/sdk";
import { BalanceInfo } from "./types";

const hexToBigInt = (hexString: string) => BigInt(hexString)

export async function getBalance (entropy: Entropy, address: string): Promise<number> {
  const accountInfo = (await entropy.substrate.query.system.account(address)) as any
  return parseInt(hexToBigInt(accountInfo.data.free).toString())
}

export async function getBalances (entropy: Entropy, addresses: string[]): Promise<BalanceInfo> {
  const balanceInfo: BalanceInfo = {}
  await Promise.all(addresses.map(async address => {
    try {
      const balance = await getBalance(entropy, address)
      
      balanceInfo[address] = { balance }
    } catch (error) {
      balanceInfo[address] = { error: error.message }
    }
  }))
  
  return balanceInfo
}