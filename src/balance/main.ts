import * as BalanceUtils from "./utils"
import { BalanceInfo } from "./types"

export class EntropyBalance {
  constructor () {}

  static async getAnyBalance (substrate, address: string) {
    const accountInfo = (await substrate.query.system.account(address)) as any
    const balance = parseInt(BalanceUtils.hexToBigInt(accountInfo.data.free).toString())

    return balance
  }

  static async getBalances (substrate, addresses: string[]): Promise<BalanceInfo[]> {
    return Promise.all(
      addresses.map(async address => {
        return EntropyBalance.getAnyBalance(substrate, address)
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
