// The purpose of this migration is to:
// 1. change encoding of empty selectedAccount from "" => null
// 2. ensure selectedAccount present is an account.name

export const version = 5

export function migrate (data) {
  try {
    const newData = { ...data }

    if (newData.selectedAccount === null) {
      // nothing to do
    }
    else if (newData.selectedAccount === "") {
      newData.selectedAccount = null
    }
    else {
      const target = newData.selectedAccount
      const accountMatchingName = newData.accounts.find(a => a.name === target)
      const accountMatchingAddress = newData.accounts.find(a => a.address === target)

      if (accountMatchingName) {
        // nothing to do
      }
      else if (accountMatchingAddress) {
        // change the refference to be the account.name
        newData.selectedAccount = accountMatchingAddress.name
      }
      else {
        throw Error(`unable to correct selectedAccount - no account found which matches "${target}"`)
      }
    }
    return newData
  } catch (err) {
    // @ts-expect-error : ts stupid
    throw Error('Migration 5 failed', { cause: err })
  }

}
