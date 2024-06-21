import { initializeEntropy } from '../../common/initializeEntropy'
import * as config from '../../config'
import { debug } from '../../common/utils'
import { getBalance } from './balance'

export async function cliGetBalance ({ address, password, endpoint }) {
  const storedConfig = await config.get()
  const account = storedConfig.accounts.find(account => account.address === address)
  if (!account) throw Error(`No account with address ${address}`)
  // QUESTION: is throwing the right response?
  debug('account', account)

  // check if data is encrypted + we have a password
  if (typeof account.data === 'string' && !password) {
    throw Error('This account requires a password, add --password <password>')
  }

  const entropy = await initializeEntropy({ keyMaterial: account.data, password, endpoint })
  const balance = await getBalance(entropy, address)

  return balance
}

