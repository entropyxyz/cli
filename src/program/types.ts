
export interface EntropyProgramDeployParams {
  bytecodePath: string,
  configurationSchemaPath?: string
  auxillaryDataSchemaPath?: string
  // TODO: confirm which of these are optional
}

export interface EntropyProgramAddParams { 
  programPointer: string
  programConfig: string
  verifyingKey?: string 
}

export interface EntropyProgramRemoveParams {
  programPointer: string
  verifyingKey: string
}

export interface EntropyProgramViewProgramsParams {
  verifyingKey: string
}
