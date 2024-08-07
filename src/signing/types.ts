export interface SignWithAdapterInput {
  /** the message as a utf-8 encoded string */
  msg: string,
  verifyingKey?: string,
  // LATER:
  // auxillaryData: any
}

export interface SignWithAdapterResult {
  signature: string
  verifyingKey: string
}