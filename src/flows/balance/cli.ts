import { initializeEntropy } from '../../common/initializeEntropy'
import * as config from '../../config'
import { debug } from '../../common/utils'

const hexToBigInt = (hexString: string) => BigInt(hexString)

export async function cliGetBalance (accountAddress, password, endpoint) {
  const storedConfig = await config.get()
  const account = storedConfig.accounts.find(account => account.address === accountAddress)
  if (!account) throw Error(`No account with address ${accountAddress}`)
  // QUESTION: is throwing the right response?
  debug('account', account)

  const entropy = await initializeEntropy({ keyMaterial: account.data, password, endpoint })

  const accountInfo = (await entropy.substrate.query.system.account(accountAddress)) as any
  debug('accountInfo', accountInfo)

  return hexToBigInt(accountInfo.data.free).toString()
}

