import { findAccountByAddressOrName, print } from "src/common/utils"
import { EntropyBalance } from "./main"

export async function entropyBalance (entropy, endpoint, storedConfig) {
  try {
    const balanceService = new EntropyBalance(entropy, endpoint)
    const address = findAccountByAddressOrName(storedConfig.accounts, storedConfig.selectedAccount)?.address
    const balance = await balanceService.getBalance(address)
    print(`Entropy Account [${storedConfig.selectedAccount}] (${address}) has a balance of: ${balance.toLocaleString('en-US')} BITS`)
  } catch (error) {
    console.error('There was an error retrieving balance', error)
  }
}
