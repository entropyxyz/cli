import * as crypto from 'crypto'

export const questions = [
  {
    type: 'password:',
    name: 'password',
    mask: '*',
    when: ({ askForPassword }) => askForPassword,
  },
  {
    type: 'password:',
    name: 'password',
    mask: '*',
    when: ({ newPassword }) => newPassword,
  },
  {
    type: 'password:',
    message: 'confirm password',
    name: 'confirmPassword',
    mask: '*',
    validate: (confirmPassword, { password }) => { return confirmPassword === password ? true : 'incorrect password' },
    when: ({ newPassword }) => newPassword
  },
]



// Function to generate a key and IV using a password and salt
function generateKeyAndIV (password, salt) {
  return crypto.scryptSync(password, salt, 32, { N: 2 ** 14 }).slice(0, 32)
}

// Function to encrypt data with a password
export function encrypt (anyData, password) {
  const data = JSON.stringify(anyData)
  const salt = crypto.randomBytes(16)
  const key = generateKeyAndIV(password, salt)
  const cipher = crypto.createCipheriv('aes-256-gcm', key, Buffer.alloc(16))
  const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()

  return Buffer.concat([salt, tag, encrypted]).toString('base64')
}

// Function to decrypt data with a password
export function decrypt (encryptedData, password) {
  const buffer = Buffer.from(encryptedData, 'base64')
  const salt = buffer.slice(0, 16)
  const tag = buffer.slice(16, 32)
  const data = buffer.slice(32)

  const key = generateKeyAndIV(password, salt)
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.alloc(16))
  decipher.setAuthTag(tag)

  let returnData = decipher.update(data, null, 'utf8') + decipher.final('utf8')
  try {
    returnData = JSON.parse(returnData)
  } catch (e) {/*swallo all parse errors*/}
  return returnData
}
