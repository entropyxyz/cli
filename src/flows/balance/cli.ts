import { initializeEntropy } from '../../common/initializeEntropy'
import * as config from '../../config'
import { debug } from '../../common/utils'

const hexToBigInt = (hexString: string) => BigInt(hexString)

export default async function getBalanceCLI (accountAddress, password, endpoint) {
  const storedConfig = await config.get()
  const account = storedConfig.accounts.find(account => account.address === accountAddress)
  if (!account) throw Error(`No account with address ${accountAddress}`)
  // QUESTION: is this the right response?
  debug('account', account)

  const entropy = await initializeEntropy({ keyMaterial: account.data, password, endpoint })

  const accountInfo = (await entropy.substrate.query.system.account(accountAddress)) as any
  debug('accountInfo', accountInfo)
  const freeBalance = hexToBigInt(accountInfo.data.free)

  return freeBalance.toString()
}

