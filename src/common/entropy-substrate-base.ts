import { EntropyLogger } from "./logger";

export abstract class EntropySubstrateBase {
  protected logger: EntropyLogger
  protected substrate: any
  protected endpoint: string

  constructor ({ substrate, endpoint, flowContext }: { substrate: any, endpoint: string, flowContext: string }) {
    this.logger = new EntropyLogger(flowContext, endpoint)
    this.substrate = substrate
    this.endpoint = endpoint
  }
}
