export interface EntropyConfig {
  accounts: EntropyAccountConfig[]
  endpoints: { dev: string; 'test-net': string }
  'migration-version': string
}

export interface EntropyAccountConfig {
  name: string
  address: string
  data: EntropyAccountData
}

export interface EntropyAccountData {
  debug?: boolean
  seed: string
  admin?: EntropyAccount
  registration?: EntropyAccount
  deviceKey?: EntropyAccount
  programDev?: EntropyAccount
}

export interface EntropyAccount {
  seed: string
  path: string
  address: string
  verifyingKeys?: string[]
  userContext?: EntropyAccountContextType
  used?: boolean
}

export enum EntropyAccountContextType {
  programDev = 'PROGRAM_DEV_KEY',
  registration = 'ADMIN_KEY',
  deviceKey = 'CONSUMER_KEY',
  undefined = 'MIXED_KEY',
}