export const version = '1' // make future versions a number plz

export function migrate (data = {}) {
  try {
    const migratedData = {
      ...data,
      endpoints: {
        dev: 'ws://127.0.0.1:9944',
        'test-net': 'wss://testnet.entropy.xyz'
      }
    }
    return migratedData
  } catch (e) {
    console.error(`error in migration ${version}: e.message`)
  }
  return data
}
