import { findAccountByAddressOrName, getTokenDetails, print, round, nanoBitsToBits } from "src/common/utils"
import { EntropyBalance } from "./main"

export async function entropyBalance (entropy, endpoint, storedConfig) {
  try {
    // grabbing decimals from chain spec as that is the source of truth for the value
    const { decimals, symbol } = await getTokenDetails(entropy)
    const balanceService = new EntropyBalance(entropy, endpoint)
    const address = findAccountByAddressOrName(storedConfig.accounts, storedConfig.selectedAccount)?.address
    const nanoBalance = await balanceService.getBalance(address)
    const balance = round(nanoBitsToBits(nanoBalance, decimals))
    print(`Entropy Account [${storedConfig.selectedAccount}] (${address}) has a balance of: ${balance} ${symbol}`)
  } catch (error) {
    console.error('There was an error retrieving balance', error)
  }
}
