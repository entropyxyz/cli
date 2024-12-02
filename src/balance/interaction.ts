import { findAccountByAddressOrName, print } from "src/common/utils"

import { EntropyBalance } from "./main"
import { EntropyTuiOptions } from '../types'

export async function entropyBalance (entropy, opts: EntropyTuiOptions, storedConfig) {
  try {
    const balanceService = new EntropyBalance(entropy, opts.endpoint)
    const address = findAccountByAddressOrName(storedConfig.accounts, storedConfig.selectedAccount)?.address
    const balance = await balanceService.getBalance(address)
    print(`Entropy Account [${storedConfig.selectedAccount}] (${address}) has a balance of: ${balance.toLocaleString('en-US')} BITS`)
  } catch (error) {
    console.error('There was an error retrieving balance', error)
  }
}
