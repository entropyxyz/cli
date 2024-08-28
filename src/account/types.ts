export interface AccountCreateParams {
  name: string
  seed: string
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
