import Entropy from "@entropyxyz/sdk"

import { EntropyBase } from "../common/entropy-base"
import { FLOW_CONTEXT } from "./constants"
import { loadFile, jsonToHex } from "./utils"
import {
  EntropyProgramDeployParams,
  EntropyProgramAddParams,
  EntropyProgramRemoveParams,
  EntropyProgramViewProgramsParams
} from "./types"

export class EntropyProgram extends EntropyBase {
  constructor (entropy: Entropy, endpoint: string) {
    super({ entropy, endpoint, flowContext: FLOW_CONTEXT })
  }

  // User Methods:

  async add ({ programPointer, programConfigPath, verifyingKey }: EntropyProgramAddParams): Promise<void> {
  // QUESTION: change the signature to "required + opts"?
  // i.e.
  // async add (programPointer, { programConfigPath, verifyingKey }): Promise<void> {
    let programConfig = undefined
    if (programConfigPath) {
      const programConfigJson = await loadFile(programConfigPath, 'json')
      programConfig = jsonToHex(programConfigJson)
    }

    return this.entropy.programs.add(
      {
        program_pointer: programPointer,
        program_config: programConfig,
      },
      verifyingKey
    )
  }

  async remove ({ programPointer, programModKey, verifyingKey }: EntropyProgramRemoveParams): Promise<any> {
    return this.entropy.programs.remove(
      programPointer,
      programModKey || verifyingKey,
      verifyingKey
    )
  }

  async list ({ verifyingKey }: EntropyProgramViewProgramsParams): Promise<any[]> {
    return this.entropy.programs.get(verifyingKey)
  }

  // Dev Methods:

  async deploy (params: EntropyProgramDeployParams) {
    const bytecode = await loadFile(params.bytecodePath)
    const configurationSchema = await loadFile(params.configurationSchemaPath, 'json')
    const auxillaryDataSchema = await loadFile(params.auxillaryDataSchemaPath, 'json')
    // QUESTION: where / how are schema validated?

    return this.entropy.programs.dev.deploy(
      bytecode,
      jsonToHex(configurationSchema),
      jsonToHex(auxillaryDataSchema)
    )
  }

  async get (programPointer: string): Promise<any> {
    this.logger.debug(`program pointer: ${programPointer}`, `${FLOW_CONTEXT}::PROGRAM_PRESENCE_CHECK`);
    return this.entropy.programs.dev.get(programPointer)
  }

  async listDeployed () {
    // QUESTION: does the CLI ever want to take in an address?
    const address = this.entropy.keyring.accounts.registration.address
    return this.entropy.programs.dev.getByDeployer(address)
  }
}

