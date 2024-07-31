import Entropy from "@entropyxyz/sdk";
import { EntropyBase } from "../common/entropy-base";
import { BalanceInfo } from "./types";
import { FLOW_CONTEXT } from "./constants";

const hexToBigInt = (hexString: string) => BigInt(hexString)

export class BalanceService extends EntropyBase {
  constructor (entropy: Entropy, endpoint: string) {
    super(entropy, endpoint, FLOW_CONTEXT)
  }

  public async getBalance (address: string): Promise<number> {
    try {
      const accountInfo = (await this.entropy.substrate.query.system.account(address)) as any
      
      return parseInt(hexToBigInt(accountInfo.data.free).toString())
    } catch (error) {
      this.logger.error(`There was an error getting balance for [acct = ${address}]`, error);
      throw new Error(error.message)
    }
  }

  public async getBalances (addresses: string[]): Promise<BalanceInfo> {
    const balanceInfo: BalanceInfo = {}
    try {
      await Promise.all(addresses.map(async address => {
        try {
          const balance = await this.getBalance(address)
          
          balanceInfo[address] = { balance }
        } catch (error) {
          this.logger.error(`Error retrieving balance for ${address}`, error);
          balanceInfo[address] = { error: error.message }
        }
      }))
      
      return balanceInfo
    } catch (error) {
      this.logger.error(`There was an error getting balances for [${addresses}]`, error);
      throw new Error(error.message)
    }
  }
}