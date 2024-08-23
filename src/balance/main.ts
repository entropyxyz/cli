import Entropy from "@entropyxyz/sdk"
import { EntropyBase } from "../common/entropy-base"
import * as BalanceUtils from "./utils"

const FLOW_CONTEXT = 'ENTROPY-BALANCE'
export class EntropyBalance extends EntropyBase {
  constructor (entropy: Entropy, endpoint: string) {
    super(entropy, endpoint, FLOW_CONTEXT)
  }

  public async getBalance (address: string) {
    const balance = await BalanceUtils.getBalance(this.entropy, address)

    this.logger.log(`Current balance of ${address}: ${balance}`, EntropyBalance.name)
    
    return `${balance.toLocaleString('en-US')} BITS`
  }
}