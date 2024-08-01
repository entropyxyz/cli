import Entropy from "@entropyxyz/sdk"
import { BaseCommand } from "../common/base-command"
import * as BalanceUtils from "./utils"
import { FLOW_CONTEXT } from "./constants"

export class BalanceCommand extends BaseCommand {
  constructor (entropy: Entropy, endpoint: string) {
    super(entropy, endpoint, FLOW_CONTEXT)
  }

  public async getBalance (address: string) {
    const balance = await BalanceUtils.getBalance(this.entropy, address)

    this.logger.log(`Current balance of ${address}: ${balance}`, `${BalanceCommand.name}`)
    
    return `${balance.toLocaleString('en-US')} BITS`
  }
}