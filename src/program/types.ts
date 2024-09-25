
export interface EntropyProgramDeployParams {
  bytecodePath: string,
  configurationSchemaPath?: string
  auxillaryDataSchemaPath?: string
  // TODO: confirm which of these are optional
}

export interface EntropyProgramAddParams { 
  programPointer: string
  programConfigPath?: string
  verifyingKey?: string 
}

export interface EntropyProgramRemoveParams {
  programPointer: string
  programModKey?: string
  verifyingKey?: string
}

export interface EntropyProgramViewProgramsParams {
  verifyingKey: string
}
