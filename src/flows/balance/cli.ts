import { initializeEntropy } from '../../common/initializeEntropy'
import * as config from '../../config'
import { getBalance } from './balance'
import { EntropyLogger } from 'src/common/logger'

export async function cliGetBalance ({ address, password, endpoint }) {
  const logger = new EntropyLogger('CLI::CHECK_BALANCE', endpoint)
  const storedConfig = await config.get()
  const account = storedConfig.accounts.find(account => account.address === address)
  if (!account) throw Error(`No account with address ${address}`)
  // QUESTION: is throwing the right response?
  logger.debug('account', account)

  // check if data is encrypted + we have a password
  if (typeof account.data === 'string' && !password) {
    throw Error('This account requires a password, add --password <password>')
  }

  const entropy = await initializeEntropy({ keyMaterial: account.data, password, endpoint })
  const balance = await getBalance(entropy, address)
  
  return `${balance.toLocaleString('en-US')} BITS`
}

