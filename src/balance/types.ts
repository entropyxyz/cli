export type BalanceInfoWithError = {
  balance?: number
  error?: Error
}

export interface BalanceInfo {
  [address: string]: BalanceInfoWithError
}