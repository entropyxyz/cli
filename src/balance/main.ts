import Entropy from "@entropyxyz/sdk"
import { EntropyBase } from "../common/entropy-base"
import * as BalanceUtils from "./utils"
import { BalanceInfo } from "./types"

const FLOW_CONTEXT = 'ENTROPY-BALANCE'
export class EntropyBalance extends EntropyBase {
  constructor (entropy: Entropy, endpoint: string) {
    super({ entropy, endpoint, flowContext: FLOW_CONTEXT })
  }

  async getBalance (address: string): Promise<number> {
    const accountInfo = (await this.entropy.substrate.query.system.account(address)) as any
    const balance = parseInt(BalanceUtils.hexToBigInt(accountInfo.data.free).toString())

    this.logger.log(`Current balance of ${address}: ${balance}`, EntropyBalance.name)
    return balance
  }

  async getBalances (addresses: string[]): Promise<BalanceInfo[]> {
    return Promise.all(
      addresses.map(async address => {
        return this.getBalance(address)
          .then((balance: number) => {
            return { address, balance }
          })
          .catch((error: Error) => {
            return { address, error }
          })
      })
    )
  }
}
