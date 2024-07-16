export interface AddProgramParams { 
  programPointer: string
  programConfig: string
  verifyingKey?: string 
}

export interface RemoveProgramParams {
  programPointer: string
  verifyingKey: string
}