export const version = 4

export function migrate (data = {}) {
  try {
    const migratedData = {
      ...data,
      // @ts-ignore
      accounts: data.accounts.map(account => {
        if (account?.data?.admin?.verifyingKeys) {
          account.data.admin.verifyingKeys = []
        }
        if (account?.data?.registration?.verifyingKeys) {
          account.data.registration.verifyingKeys = []
        }
        return account
      })
    }
    return migratedData
  } catch (e) {
    console.error(`error in migration ${version}: e.message`)
  }
  return data
}
