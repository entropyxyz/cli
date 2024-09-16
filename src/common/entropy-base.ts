import Entropy from "@entropyxyz/sdk";
import { EntropyLogger } from "./logger";

export abstract class EntropyBase {
  protected logger: EntropyLogger
  protected entropy: Entropy
  protected endpoint: string

  constructor (entropy: Entropy, endpoint: string, flowContext: string) {
    this.logger = new EntropyLogger(flowContext, endpoint)
    this.entropy = entropy
    this.endpoint = endpoint
  }
}