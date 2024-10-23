export interface EntropyTuiOptions {
  /*
   * NOTE: we can't currently set account, endpoint, see cli.ts notes
   */
  // account: string
  // endpoint: string
  dev: boolean
}

type EntropyLoggerLogLevel = 'error' | 'warn' | 'info' | 'debug'

export interface EntropyLoggerOptions {
  debug?: boolean
  level?: EntropyLoggerLogLevel
  isTesting?: boolean
}
