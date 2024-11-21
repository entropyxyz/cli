import { BalanceInfo } from "./types"

export const hexToBigInt = (hexString: string) => BigInt(hexString)

export function formattedBalances (balanceInfo: BalanceInfo, symbol: string = 'BITS') {
  const balances = []
  Object.keys(balanceInfo)
    .forEach(key => 
      balances.push({
        account: key, 
        amount: !balanceInfo[key].error ? balanceInfo[key].balance : null, 
        symbol 
      })
    )
  return balances
}