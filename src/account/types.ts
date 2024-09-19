export interface AccountCreateParams {
  name: string
  path?: string
}

export interface AccountImportParams {
  seed: string
  name: string
  path?: string
}

export type AccountListResults = {
  name: string
  address: string
  verifyingKeys: string[]
}

export interface AccountRegisterParams {
  programModAddress?: string
  // TODO: Export ProgramInstance type from sdk
  programData?: any
}
