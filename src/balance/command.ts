import Entropy from "@entropyxyz/sdk"
import { Base } from "../common/base"
import { BalanceUtils } from "./utils"
import { FLOW_CONTEXT } from "./constants"

export class BalanceCommand extends Base {
  private readonly balanceService: BalanceUtils

  constructor (entropy: Entropy, endpoint: string) {
    super(entropy, endpoint, FLOW_CONTEXT)
    this.balanceService = new BalanceUtils(this.entropy, endpoint)
  }

  public async getBalance (address: string) {
    const balance = await this.balanceService.getBalance(address)

    this.logger.log(`Current balance of ${address}: ${balance}`, `${BalanceCommand.name}`)
    
    return `${balance.toLocaleString('en-US')} BITS`
  }
}