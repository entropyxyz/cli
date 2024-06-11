import * as config from '../../config'

export async function cliListAccounts () {
  const storedConfig = await config.get()

  return storedConfig.accounts
    .map(account => ({
      name: account.name,
      address: account.address
    }))
}
