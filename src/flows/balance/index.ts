const hexToBigInt = (hexString: string) => BigInt(hexString)

export async function checkBalance (entropy) {
  const accountAddress = entropy.keyring.accounts.registration.address
    
  const accountInfo = (await entropy.substrate.query.system.account(accountAddress)) as any
  const freeBalance = hexToBigInt(accountInfo.data.free)
  console.log(`Address ${accountAddress} has a balance of: ${freeBalance.toString()} bits`)
}
