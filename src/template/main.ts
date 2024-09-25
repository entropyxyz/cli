import Entropy from "@entropyxyz/sdk";
import { EntropyBase } from "../common/entropy-base";

/*

This provides core functions that should be unit tested

consumed by both ./command.ts and ./interaction.ts

should follow a pattern of take in arguments return result with little side effects
in between NO PRINTING!

atempt strict typeing

*/


// this is for logger context incase something fails and a user can provide a report
const FLOW_CONTEXT = 'ENTROPY_TEMPLATE'

export class EntropyTemplate extends EntropyBase {
  constructor (entropy: Entropy, endpoint: string) {
    super({ entropy, endpoint, flowContext: FLOW_CONTEXT })
  }

  async mainExcutableFunction () {
    // write code requireing the use of entropy!
  }

  static async classMethod () {
    // write stateless one-offs
  }
}
