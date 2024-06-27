export const version = 1

export function migrate (data = {}) {
  try {
    const migratedData = {
      ...data,
      endpoints: {
        // @ts-ignore
        ...data.endpoints,
        'test-net': 'wss://testnet.entropy.xyz'
      }
    }
    return migratedData
  } catch (e) {
    console.error(`error in migration ${version}: e.message`)
  }
  return data
}
