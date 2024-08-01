import Entropy from "@entropyxyz/sdk";
import { RemoveProgramParams } from "./types";

export async function removeProgram (entropy: Entropy, { programPointer, verifyingKey }: RemoveProgramParams): Promise<any> {
  return entropy.programs.remove(
    programPointer,
    verifyingKey
  )
}