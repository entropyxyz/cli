import Entropy from "@entropyxyz/sdk"
// @ts-expect-error
import { getSubstrate } from '@entropyxyz/sdk/utils'
import { EntropyBase } from "../common/entropy-base"
import * as BalanceUtils from "./utils"
import { BalanceInfo } from "./types"

const FLOW_CONTEXT = 'ENTROPY-BALANCE'
export class EntropyBalance extends EntropyBase {
  constructor (entropy: Entropy, endpoint: string) {
    super({ entropy, endpoint, flowContext: FLOW_CONTEXT })
  }

  static async getAnyBalance (endpoint: string, address: string) {
    const substrate = getSubstrate(endpoint)
    await substrate.isReadyOrError

    const accountInfo = (await substrate.query.system.account(address)) as any
    const balance = parseInt(BalanceUtils.hexToBigInt(accountInfo.data.free).toString())
    
    // closing substrate
    await substrate.disconnect()
      .catch(err => console.error('Error closing connection', err.message))

    return balance
  }

  async getBalance (address: string): Promise<number> {
    const accountInfo = (await this.entropy.substrate.query.system.account(address)) as any
    const balance = parseInt(BalanceUtils.hexToBigInt(accountInfo.data.free).toString())

    this.logger.log(`Current balance of ${address}: ${balance}`, EntropyBalance.name)
    return balance
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
}
