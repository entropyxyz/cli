export const version = 2

export function migrate (data = {}) {
  return walk(data, encodeSomeKeys)
}


function walk (obj, replacer) {
  if (typeof obj !== 'object') return obj

  const initial = Array.isArray(obj) ? [] : {}

  return Object.entries(obj).reduce((acc, [key, value]) => {
    const newValue = replacer(key, value)
    acc[key] = walk(newValue, replacer)

    return acc
  }, initial)
}

const targetKeys = new Set(['secretKey', 'publicKey', 'addressRaw'])
function encodeSomeKeys (key, value) {
  if (!targetKeys.has(key)) return value

  const bytes = Object.keys(value)
    .map(arrayIndex => value[arrayIndex])

  console.log('BYTES', key, bytes)
  return new Uint8Array(bytes)
}
