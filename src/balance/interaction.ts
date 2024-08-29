import { print } from "src/common/utils"
import { EntropyBalance } from "./main"

export async function entropyBalance (entropy, endpoint, storedConfig) {
  try {
    const BalanceService = new EntropyBalance(entropy, endpoint)
    const balance = await BalanceService.getBalance(storedConfig.selectedAccount)
    print(`Address ${storedConfig.selectedAccount} has a balance of: ${balance.toLocaleString('en-US')} BITS`)
  } catch (error) {
    console.error('There was an error retrieving balance', error)
  }
}
