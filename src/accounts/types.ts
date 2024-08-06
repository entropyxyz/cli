export interface CreateAccountParams { name: string, seed: string, path?: string }

export type ListedAccount = {
  name: string
  address: string
  verifyingKeys: string[]
}