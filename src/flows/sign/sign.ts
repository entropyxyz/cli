interface SignWithAdapterInput {
  /** the message as a utf-8 encoded string */
  msg: string,
  verifyingKey?: string,
  // LATER:
  // auxillaryData: any
}

function stringToHex (str: string): string {
  return Buffer.from(str).toString('hex')
}

export async function signWithAdapters (entropy, input: SignWithAdapterInput) {
  return entropy.signWithAdaptersInOrder({
    msg: {
      msg: stringToHex(input.msg)
    },
    // type
    order: ['deviceKeyProxy', 'noop'],
    signatureVerifyingKey: input.verifyingKey
    // auxillaryData
  })
}
