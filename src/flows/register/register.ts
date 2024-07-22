import Entropy from "@entropyxyz/sdk";
import { RegisterParams } from "./types";
import { print } from "src/common/utils";

export async function register (entropy: Entropy, params?: RegisterParams): Promise<string> {
  let verifyingKey: string
  try {
    const registerParams = params?.programModAddress && params?.programData ? { programDeployer: params.programModAddress, programData: params.programData } : undefined
    
    verifyingKey = await entropy.register(registerParams)
    return verifyingKey
  } catch (error) {
    if (!verifyingKey) {
      try {
        const tx = entropy.substrate.tx.registry.pruneRegistration()
        await tx.signAndSend(entropy.keyring.accounts.registration.pair, ({ status }) => {
          if (status.isFinalized) {
            print('Successfully pruned registration');
          }
        })
      } catch (error) {
        console.error('Unable to prune registration due to:', error.message);
        throw error
      }
    }
    throw error
  }
}