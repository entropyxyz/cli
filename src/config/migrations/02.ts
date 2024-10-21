export const version = 2

const targetKeys = new Set(['secretKey', 'publicKey', 'addressRaw'])

export function migrate (data = {}) {
  if (!isObject(data)) return data
  if (isUI8A(data)) return data

  const initial = isArray(data) ? [] : {}

  return Object.entries(data).reduce((acc, [key, value]) => {
    if (targetKeys.has(key) && !isUI8A(value)) {
      acc[key] = objToUI8A(value)
    }
    else {
      acc[key] = migrate(value)
    }

    return acc
  }, initial)
}


function isObject (thing) {
  return typeof thing === 'object'
}

function isArray (thing) {
  return Array.isArray(thing)
}

function isUI8A (thing) {
  return thing instanceof Uint8Array
}


function objToUI8A (obj) {
  const bytes = Object.keys(obj)
    .sort((a, b) => Number(a) > Number(b) ? 1 : -1)
    .map(arrayIndex => obj[arrayIndex])

  return new Uint8Array(bytes)
}
