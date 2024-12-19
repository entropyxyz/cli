import * as BalanceUtils from "./utils"
import { BalanceInfo } from "./types"
import { EntropySubstrateBase } from "src/common/entropy-substrate-base"

const FLOW_CONTEXT = 'ENTROPY-BALANCE'
export class EntropyBalance extends EntropySubstrateBase {
  constructor (substrate: any, endpoint: string) {
    super({ substrate, endpoint, flowContext: FLOW_CONTEXT })
  }

  async getAnyBalance (address: string) {
    const accountInfo = (await this.substrate.query.system.account(address)) as any
    const balance = parseInt(BalanceUtils.hexToBigInt(accountInfo.data.free).toString())

    return balance
  }

  async getBalances (addresses: string[]): Promise<BalanceInfo[]> {
    return Promise.all(
      addresses.map(async address => {
        return this.getAnyBalance(address)
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
