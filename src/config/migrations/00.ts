export const version = '0'

export function migrate (data= {}) {
    try {
      const migratedData = {
        ...data,
        accounts: [],
        endpoints: {
          dev: '  ',
          'test-net': 'ws://54.91.12.50:9944'
        },
        'migration-version': version,
      }
      return migratedData
    } catch (e) {
      console.error(`error in migration ${version}: e.message`)
    }
  return data
}