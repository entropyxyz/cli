import { print } from "src/common/utils"
import { EntropyBalance } from "./main"

export async function entropyBalance (entropy, endpoint, storedConfig) {
  try {
    const entropyBalance = new EntropyBalance(entropy, endpoint)
    const balanceString = await entropyBalance.getBalance(storedConfig.selectedAccount)
    print(`Address ${storedConfig.selectedAccount} has a balance of: ${balanceString}`)
  } catch (error) {
    console.error('There was an error retrieving balance', error)
  }
}