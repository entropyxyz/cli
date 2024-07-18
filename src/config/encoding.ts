const PREFIX = 'data:application/UI8A;base64,'
// was a UInt8Array, but is stored as base64

export function serialize (config) {
  return JSON.stringify(config, replacer, 2)
}

export function deserialize (config) {
  return JSON.parse(config, reviver)
}

function replacer (key, value) {
  if (value instanceof Uint8Array) {
    return PREFIX + Buffer.from(value).toString('base64')
  }
  else return value
}

function reviver (key, value) {
  if (typeof value === 'string' && value.startsWith(PREFIX)) {
    const data = value.slice(PREFIX.length)
    return Uint8Array.from(Buffer.from(data, 'base64'))
  }
  else return value
}
