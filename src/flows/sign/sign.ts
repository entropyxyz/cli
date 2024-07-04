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
  const content = {
    msg: {
      msg: stringToHex(input.msg)
    },
    // type
    order: ['deviceKeyProxy', 'noop'],
    signatureVerifyingKey: input.verifyingKey
    // auxillaryData
  }

  return entropy.signWithAdaptersInOrder(content)
    .catch(async (err) => {
      // See https://github.com/entropyxyz/sdk/issues/367 for reasoning behind adding this retry mechanism
      if (err.message.includes('Invalid Signer') || err.message.includes('Invalid Signer in Signing group')) {
        // retry signing with a reverse order in the subgroups list
        // QUESTION: will we need a different strategy to retry when there are >2 things to order
        content.order = content.order.reverse()
        return entropy.signWithAdaptersInOrder(content)
      }

      throw err
    })
}
