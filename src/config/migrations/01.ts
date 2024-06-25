export const version = '1' // make future versions a number plz

export function migrate (data = {}) {
  try {
    const migratedData = {
      ...data,
      endpoints: {
        // @ts-ignore
        ...data.endpoints,
        'test-net': 'wss://testnet.entropy.xyz'
      },
      'migration-version': version,
    }
    return migratedData
  } catch (e) {
    console.error(`error in migration ${version}: e.message`)
  }
  return data
}
