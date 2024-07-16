export interface AddProgramParams { 
  programPointer: string
  programConfig: string
  verifyingKey?: string 
}
export interface ViewProgramsParams {
  verifyingKey: string
}