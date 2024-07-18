import { initializeEntropy } from '../../common/initializeEntropy'
import * as config from '../../config'
import { formatAmountAsHex } from '../../common/utils'
import { EntropyLogger } from 'src/common/logger'

export async function cliEntropyTransfer ({ source, password, destination, amount, endpoint }) {
  const logger = new EntropyLogger('CLI::TRANSFER', endpoint)
  // NOTE: password is optional, is only for source account (if that is encrypted)

  const storedConfig = await config.get()
  const account = storedConfig.accounts.find(account => account.address === source)
  if (!account) throw Error(`No account with address ${source}`)
  // QUESTION: is throwing the right response?
  logger.debug('account', account)

  const entropy = await initializeEntropy({ keyMaterial: account.data, password, endpoint })

  if (!entropy?.registrationManager?.signer?.pair) {
    throw new Error("Signer keypair is undefined or not properly initialized.")
  }
  const formattedAmount = formatAmountAsHex(amount)
  const tx = await entropy.substrate.tx.balances.transferAllowDeath(
    destination,
    BigInt(formattedAmount),
    // WARNING: this is moving ... a lot? What?
  )

  await tx.signAndSend (entropy.registrationManager.signer.pair, ({ status }) => {
    logger.debug('signAndSend status:')
    logger.debug(status)
  })
}
