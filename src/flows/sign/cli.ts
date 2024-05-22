import { initializeEntropy } from "../../common/initializeEntropy"
import { debug } from "../../common/utils"
import * as config from '../../config'

// TODO: revisit this file, rename as signEthTransaction?
export async function cliSign ({ address, message, endpoint }) {

  const storedConfig = await config.get()
  const account = storedConfig.accounts.find(account => account.address === address)
  if (!account) throw Error(`No account with address ${address}`)
  // QUESTION: is throwing the right response?
  debug('account', account)

  const entropy = await initializeEntropy({ keyMaterial: account.data, endpoint })

  // const signature = (await entropy.sign({
  //   msg: message
  // })) as string

  return signature
}
