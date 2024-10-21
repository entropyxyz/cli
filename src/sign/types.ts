export interface SignResult {
  signature: string
  verifyingKey: string
}

export interface RawSignPayload {
  sigRequestHash: string
  hash: any
  auxiliaryData: any
  signatureVerifyingKey?: string
}
