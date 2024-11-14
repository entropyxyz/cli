import { BalanceInfo } from "./types"

export const hexToBigInt = (hexString: string) => BigInt(hexString)

export function formattedBalances (balanceInfo: BalanceInfo) {
  const balances = {}
  Object.keys(balanceInfo).forEach(key => balances[key] = !balanceInfo[key].error ? `${balanceInfo[key].balance.toLocaleString('en-us')} BITS` : null)
  return balances
}