import { print } from "src/common/utils"
import { EntropyBalance } from "./main"

export async function entropyBalance (entropy, endpoint, storedConfig) {
  try {
    const BalanceService = new EntropyBalance(entropy, endpoint)
    const balanceString = await BalanceService.getAccountBalance(storedConfig.selectedAccount)
    print(`Address ${storedConfig.selectedAccount} has a balance of: ${balanceString}`)
  } catch (error) {
    console.error('There was an error retrieving balance', error)
  }
}