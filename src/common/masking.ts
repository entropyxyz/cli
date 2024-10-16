const PREFIX = 'data:application/UI8A;base64,'
const DEFAULT_MASKED_FIELDS = new Set([
  'seed',
  'secretKey',
  'addressRaw',
]);

export function maskPayload (payload: any): any {
  if (
    typeof payload === 'string' ||
    typeof payload === 'boolean' ||
    payload === null
  ) return payload

  const maskedPayload = Array.isArray(payload)
    ? []
    : {}

  // maskJSONFields doesn't handle nested objects very well so we'll
  // need to recursively walk to object and mask them one by one
  return Object.entries(payload).reduce((acc, [property, value]) => {
    if (DEFAULT_MASKED_FIELDS.has(property)) {
      // @ts-expect-error .length does not exist on type "unknown"
      acc[property] = "*".repeat(value?.length || 32)
    }
    else if (value instanceof Uint8Array) {
      acc[property] = PREFIX + Buffer.from(value).toString('base64')
    }
    else if (typeof value === 'object') {
      acc[property] = maskPayload(value);
    }
    else {
      acc[property] = value
    }

    return acc
  }, maskedPayload)
}
