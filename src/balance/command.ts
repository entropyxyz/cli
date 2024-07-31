import Entropy from "@entropyxyz/sdk"
import { EntropyBase } from "../common/entropy-base"
import { BalanceService } from "./utils"
import { FLOW_CONTEXT } from "./constants"

export class BalanceController extends EntropyBase {
  private readonly balanceService: BalanceService

  constructor (entropy: Entropy, endpoint: string) {
    super(entropy, endpoint, FLOW_CONTEXT)
    this.balanceService = new BalanceService(this.entropy, endpoint)
  }

  public async getBalance (address: string) {
    const balance = await this.balanceService.getBalance(address)

    this.logger.log(`Current balance of ${address}: ${balance}`, `${BalanceController.name}`)
    
    return `${balance.toLocaleString('en-US')} BITS`
  }
}