import Entropy from "@entropyxyz/sdk";
import { RegsiterParams } from "./types";
import { print } from "src/common/utils";

export async function register (entropy: Entropy, params?: RegsiterParams): Promise<string> {
  let verifyingKey: string
  try {
    const registerParams = params.programModAddress && params.programData ? { programDeployer: params.programModAddress, programData: params.programData } : undefined
    verifyingKey = await entropy.register(registerParams)
    return verifyingKey
  } catch (error) {
    if (!verifyingKey) {
      // logger.debug('Pruning Registration', FLOW_CONTEXT)
      try {
        const tx = await entropy.substrate.tx.registry.pruneRegistration()
        await tx.signAndSend(entropy.keyring.accounts.registration.pair, ({ status }) => {
          if (status.isFinalized) {
            print('Successfully pruned registration');
          }
        })
      } catch (error) {
        console.error('Unable to prune registration due to:', error.message);
        throw error
      }
    } else {
      throw error
    }
  }
}