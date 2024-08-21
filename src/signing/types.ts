export interface SignWithAdapterInput {
  /** the message as a utf-8 encoded string */
  msg: string,
  verifyingKey?: string,
  // LATER:
  // auxillaryData: any
}

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