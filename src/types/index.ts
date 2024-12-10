export interface EntropyTuiOptions {
  account?: string
  config: string
  endpoint: string
  dev: boolean
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