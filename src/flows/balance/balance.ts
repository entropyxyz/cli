import Entropy from "@entropyxyz/sdk";
import { BalanceInfo } from "./types";

const hexToBigInt = (hexString: string) => BigInt(hexString)

export async function getBalance (entropy: Entropy, address: string): Promise<number> {
  try {
    const accountInfo = (await entropy.substrate.query.system.account(address)) as any
    
    return parseInt(hexToBigInt(accountInfo.data.free).toString())
  } catch (error) {
    // console.error(`There was an error getting balance for [acct = ${address}]`, error);
    throw new Error(error.message)
  }
}

export async function getBalances (entropy: Entropy, addresses: string[]): Promise<BalanceInfo> {
  const balanceInfo: BalanceInfo = {}
  try {
    await Promise.all(addresses.map(async address => {
      try {
        const balance = await getBalance(entropy, address)
        
        balanceInfo[address] = { balance }
      } catch (error) {
        // console.error(`Error retrieving balance for ${address}`, error);
        balanceInfo[address] = { error: error.message }
      }
    }))
    
    return balanceInfo
  } catch (error) {
    // console.error(`There was an error getting balances for [${addresses}]`, error);
    throw new Error(error.message)
  }
}