export interface CreateAccountParams { name: string, seed: string, path?: string }

export type ListedAccount = {
  name: string
  address: string
  verifyingKeys: string[]
}

export interface RegisterParams {
  programModAddress?: string
  // TODO: Export ProgramInstance type from sdk
  programData?: any
}