export const version = '0'

export function migrate (data= {}) {
    try {
      const migratedData = {
        ...data,
        accounts: [],
        endpoints: {
          dev: 'ws://127.0.0.1:9944',
          'test-net': 'ws://54.175.228.156:9944'
        },
        'migration-version': version,
      }
      return migratedData
    } catch (e) {
      console.error(`error in migration ${version}: e.message`)
    }
  return data
}