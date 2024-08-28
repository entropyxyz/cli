import Entropy from "@entropyxyz/sdk"
import { EntropyBase } from "../common/entropy-base"
import * as BalanceUtils from "./utils"
import { BalanceInfo } from "./types"

const FLOW_CONTEXT = 'ENTROPY-BALANCE'
export class EntropyBalance extends EntropyBase {
  constructor (entropy: Entropy, endpoint: string) {
    super(entropy, endpoint, FLOW_CONTEXT)
  }

  async getBalance (address: string): Promise<number> {
    const accountInfo = (await this.entropy.substrate.query.system.account(address)) as any
    return parseInt(BalanceUtils.hexToBigInt(accountInfo.data.free).toString())
  }
  
  async getBalances (addresses: string[]): Promise<BalanceInfo> {
    const balanceInfo: BalanceInfo = {}
    await Promise.all(addresses.map(async address => {
      try {
        const balance = await this.getBalance(address)
        
        balanceInfo[address] = { balance }
      } catch (error) {
        balanceInfo[address] = { error: error.message }
      }
    }))
    
    return balanceInfo
  }

  async getAccountBalance (address: string) {
    const balance = await this.getBalance(address)

    this.logger.log(`Current balance of ${address}: ${balance}`, EntropyBalance.name)
    
    return `${balance.toLocaleString('en-US')} BITS`
  }
}
