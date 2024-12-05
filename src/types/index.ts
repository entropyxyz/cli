export interface EntropyTuiOptions {
  account: string
  endpoint: string
  dev: boolean
  version: string
  coreVersion: string
}

type EntropyLoggerLogLevel = 'error' | 'warn' | 'info' | 'debug'

export interface EntropyLoggerOptions {
  debug?: boolean
  level?: EntropyLoggerLogLevel
  isTesting?: boolean
}

export type TokenDetails = { 
  decimals: number
  symbol: string
}