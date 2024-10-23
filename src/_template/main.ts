/* eslint-disable @typescript-eslint/no-unused-vars */

import Entropy from "@entropyxyz/sdk";
import { EntropyBase } from "../common/entropy-base";

/*

  This file provides core functions consumed by both ./command.ts and ./interaction.ts

  ## Conventions

  1. unit tested
  2. tight interface
      - strict typing
      - no this-or-that function signatures
  3. minimal side-effects
      - ✓ logging
      - ✓ substrate queries/ mutations
      - ✗ config mutation
      - ✗ printing


  ## This example

  We use the made-up domain "dance" so we will have names like
  - ENTROPY_DANCE
  - EntropyDance
  - dance = new EntropyDance(entroyp, endpoint)
  - tests: tests/dance.test.ts

*/


// this is for logging output
const FLOW_CONTEXT = 'ENTROPY_DANCE'

export class EntropyDance extends EntropyBase {
  static isDanceMove (danceName: string) {
    // stateless function - useful if you do not have/ need an entropy instance
    // NOTE: no logging
    return Boolean(danceName)
  }

  constructor (entropy: Entropy, endpoint: string) {
    super({ entropy, endpoint, flowContext: FLOW_CONTEXT })
  }

  async learn (danceMoveByteCode) {
    // write code requiring the use of entropy
    //
    // return this.entropy...
  }

  async add (verifyingKey, dancePointer, danceConfig) {
    // ..
  
    // logging
    this.logger.debug(`add: ${dancePointer} to ${verifyingKey}`, `${FLOW_CONTEXT}::add_dance`);
  }
}
