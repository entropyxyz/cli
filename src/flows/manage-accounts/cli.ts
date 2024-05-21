import * as config from '../../config'

export async function cliListAccounts () {
  const storedConfig = await config.get()

  return storedConfig.accounts
  // TODO: check what sort of data is safe to export:
  // - ✓ name
  // - ✓ address
  // - ? data (keyMaterial)
}
