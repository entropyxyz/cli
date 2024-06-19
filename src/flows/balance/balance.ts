import Entropy from "@entropyxyz/sdk";
import { hexToBigInt } from "@polkadot/util";

export async function getBalance (entropy: Entropy, address: string): Promise<bigint> {
  try {
    const accountInfo = (await entropy.substrate.query.system.account(address)) as any
    return hexToBigInt(accountInfo.data.free)
  } catch (error) {
    // console.error(`There was an error getting balance for [acct = ${address}]`, error);
    throw new Error(error.message)
  }
}

type BalanceInfoWithError = {
  balance?: bigint
  error?: Error
}

interface BalanceInfo {
  [address: string]: BalanceInfoWithError
}

export async function getBalances (entropy: Entropy, addresses: string[]): Promise<BalanceInfo> {
  const balanceInfo: BalanceInfo = {}
  try {
    await entropy.substrate.query.system.account.multi(addresses, (balances: any[]) => {
      balances.forEach((balance, idx) => {
        balanceInfo[addresses[idx]] = {
          balance: hexToBigInt(balance.data.free),
        }
      })
    })
    return balanceInfo
  } catch (error) {
    // console.error(`There was an error getting balances for [${addresses}]`, error);
    throw new Error(error.message)
  }
}