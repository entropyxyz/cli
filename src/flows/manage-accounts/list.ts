import { EntropyAccountConfig } from "src/config/types"

export function listAccounts (config) {
  const accountsArray = Array.isArray(config.accounts) ? config.accounts : [config.accounts]
  if (!accountsArray.length)
    throw new Error(
      'There are currently no accounts available, please create or import your new account using the Manage Accounts feature'
    )
  return accountsArray.map((account: EntropyAccountConfig) => ({
    name: account.name,
    address: account.address,
    verifyingKeys: account?.data?.admin?.verifyingKeys
  }))
}