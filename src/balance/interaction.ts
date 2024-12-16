import { closeSubstrate, getLoadedSubstrate } from '../common/substrate-utils'
import { findAccountByAddressOrName, getTokenDetails, print, round, lilBitsToBits } from "../common/utils"
import { EntropyTuiOptions } from '../types'

import { EntropyBalance } from "./main"

export async function entropyBalance (opts: EntropyTuiOptions, storedConfig) {
  try {
    const substrate = await getLoadedSubstrate(opts.endpoint)
    // grabbing decimals from chain spec as that is the source of truth for the value
    const { decimals, symbol } = await getTokenDetails(substrate)
    const address = findAccountByAddressOrName(storedConfig.accounts, storedConfig.selectedAccount)?.address
    const lilBalance = await EntropyBalance.getAnyBalance(substrate, address)
    const balance = round(lilBitsToBits(lilBalance, decimals))
    print(`Entropy Account [${storedConfig.selectedAccount}] (${address}) has a balance of: ${balance} ${symbol}`)
    // closing substrate
    await closeSubstrate(substrate)
  } catch (error) {
    console.error('There was an error retrieving balance', error)
  }
}
