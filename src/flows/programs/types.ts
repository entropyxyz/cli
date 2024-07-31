export interface AddProgramParams {
  programPointer: string
  programConfig: string
  verifyingKey?: string
}

export interface ViewProgramsParams {
  verifyingKey: string
}

export interface RemoveProgramParams {
  programPointer: string
  verifyingKey: string
}

export interface DeployProgramParams {
  bytecodePath: string,
  configurationSchemaPath?: string
  auxillaryDataSchemaPath?: string
  // TODO: confirm which of these are optional
}
