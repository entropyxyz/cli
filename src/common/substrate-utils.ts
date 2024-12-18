// @ts-expect-error
import { createSubstrate } from '@entropyxyz/sdk/utils'

export async function getLoadedSubstrate (endpoint: string) {
  const substrate = createSubstrate(endpoint)
  await substrate.isReadyOrError
  return substrate
}

export async function closeSubstrate (substrate: any) {
  try {
    // closing substrate
    await substrate.disconnect()
  } catch (error) {
    console.error('SubstrateError: Error closing connection', error)
    throw error
  }
}