import { EntropyLogger } from "src/common/logger"
import { initializeEntropy } from "../../common/initializeEntropy"
import * as config from '../../config'
import { signWithAdapters } from './sign'

// TODO: revisit this file, rename as signEthTransaction?
export async function cliSign ({ address, message, endpoint }) {
  const logger = new EntropyLogger('CLI::SIGN', endpoint)
  const storedConfig = await config.get()
  const account = storedConfig.accounts.find(account => account.address === address)
  if (!account) throw Error(`No account with address ${address}`)
  // QUESTION: is throwing the right response?
  logger.debug('account:')
  logger.debug(account)

  const entropy = await initializeEntropy({ keyMaterial: account.data, endpoint })

  return signWithAdapters(entropy, {
    msg: message
  })
}
