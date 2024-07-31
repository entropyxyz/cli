import Entropy from "@entropyxyz/sdk";
import { EntropyLogger } from "./logger";

export abstract class Base {
  protected logger: EntropyLogger
  protected entropy: Entropy

  constructor (entropy: Entropy, endpoint: string, flowContext: string) {
    this.logger = new EntropyLogger(flowContext, endpoint)
    this.entropy = entropy
  }
}