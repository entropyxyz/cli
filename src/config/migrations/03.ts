export const version = 3

export function migrate (data = {}) {
  try {
    const migratedData = {
      ...data,
      endpoints: {
        // @ts-ignore
        ...data.endpoints,
        'stg': 'wss://api.staging.testnet.testnet-2024.infrastructure.entropy.xyz'
      }
    }
    return migratedData
  } catch (e) {
    console.error(`error in migration ${version}: e.message`)
  }
  return data
}
