import Entropy from "@entropyxyz/sdk";
import { AddProgramParams } from "./types";

export async function addProgram (entropy: Entropy, { programPointer, programConfig, verifyingKey }: AddProgramParams): Promise<void> {
  return entropy.programs.add(
    {
      program_pointer: programPointer,
      program_config: programConfig,
    },
    verifyingKey
  )
}