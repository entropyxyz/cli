import * as config from '../../config'
import { listAccounts } from './list'

export async function cliListAccounts () {
  const storedConfig = await config.get()

  return listAccounts(storedConfig)
}
