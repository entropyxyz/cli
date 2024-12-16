// @ts-expect-error
import { createSubstrate } from '@entropyxyz/sdk/utils'

export async function getLoadedSubstrate (endpoint: string) {
  const substrate = createSubstrate(endpoint)
  await substrate.isReadyOrError
  return substrate
}

export async function closeSubstrate (substrate: any) {
  // closing substrate
  return await substrate.disconnect()
    .catch(err => console.error('Error closing connection', err.message))
}