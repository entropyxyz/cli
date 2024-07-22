import Entropy from "@entropyxyz/sdk";
import { ViewProgramsParams } from "./types";

export async function viewPrograms (entropy: Entropy, { verifyingKey }: ViewProgramsParams): Promise<any[]> {
  return entropy.programs.get(verifyingKey)
}