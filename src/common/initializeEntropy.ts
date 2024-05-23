import Entropy, { wasmGlobalsReady } from "@entropyxyz/sdk"
// TODO: fix importing of types from @entropy/sdk/keys
// @ts-ignore
import Keyring from "@entropyxyz/sdk/keys"
import inquirer from "inquirer"
import { decrypt, encrypt } from "../flows/password"
import { debug } from "../common/utils"
import * as config from "../config"

// TODO: unused
// let defaultAccount // have a main account to use
// let entropys 

// a cache of keyrings
const keyrings = {
  default: undefined // this is the "selected account" keyring
}

export function getKeyring (address) {
  if (!address && keyrings.default) return keyrings.default
  if (address && keyrings[address]) return keyrings[address]
  return keyrings.default
}

// TODO: pull this type from somewhere else?
interface AccountData {
  type: string
  seed: string
  admin?: AdminDetails
  registration?: RegistrationDetails
}
interface AdminDetails {
  used: unknown
  address: unknown
}
interface RegistrationDetails {
  used: unknown
}
type MaybeKeyMaterial = AccountData | string

interface InitializeEntropyOpts {
  keyMaterial: MaybeKeyMaterial,
  password?: string,
  endpoint: string
}

// WARNING: in programatic cli mode this function should NEVER prompt users, but it will if no password was provided

export const initializeEntropy = async ({ keyMaterial, password, endpoint }: InitializeEntropyOpts): Promise<Entropy> => {
  debug('key material', keyMaterial);
  await wasmGlobalsReady()

  const { password: successfulPassword, accountData } = await getAccountDataAndPassword(keyMaterial, password)

  if (!accountData.seed) {
    throw new Error("Data format is not recognized as either encrypted or unencrypted")
  }

  debug('account:', accountData);
  if (accountData && accountData.admin && !accountData.registration) {
    accountData.registration = accountData.admin
    accountData.registration.used = true
    const store = await config.get()
    store.accounts.map((account) => {
      if (account.address === accountData.admin.address) {
        const data = (typeof account.data === 'string')
          ? encrypt(accountData, successfulPassword)
          : accountData
        account = {
          ...account,
          data,
        }
      }
      return account
    })
    // re save the entire config
    await config.set(store)
  }

  let selectedAccount
  const storedKeyring = getKeyring(accountData.admin.address)
  if(!storedKeyring) {
    const keyring = new Keyring({ ...accountData })
    keyring.accounts.on('#account-update', async (newAccoutData) => {
      const store = await config.get()
      store.accounts.map((account) => {
        if (account.address === selectedAccount.address) {
          let data = newAccoutData
          if (typeof account.data === 'string' ) data = encrypt(newAccoutData, successfulPassword)
          account = {
            ...account,
            data,
          }
        }
        return account
      })
      // re save the entire config
      await config.set(store)

    })
    keyrings.default = keyring
    debug(keyring)

    // TO-DO: fix in sdk: admin should be on kering.accounts by default
    // /*WANT*/ keyrings[keyring.admin.address] = keyring
    keyrings[keyring.getAccount().admin.address] = keyring
    selectedAccount = keyring
  } else {
    keyrings.default = storedKeyring
    selectedAccount = storedKeyring
  }

  const entropy = new Entropy({ keyring: selectedAccount, endpoint })
  await entropy.ready

  if (!entropy?.keyring?.accounts?.registration?.seed) {
    throw new Error("Keys are undefined")
  }

  return entropy
}

// NOTE: frankie this was prettier before I had to refactor it for merge conflicts, promise
async function getAccountDataAndPassword (keyMaterial: MaybeKeyMaterial, password?: string): Promise<{ password: string | void, accountData: AccountData }> {
  if (isAccountData(keyMaterial)) {
    return { 
      password: null,
      accountData: keyMaterial as AccountData
    }
  }

  if (typeof keyMaterial !== 'string') {
    throw new Error("Data format is not recognized as either encrypted or unencrypted")
  }

  /* Programmatic Mode */
  if (password) {
    const decryptedData = decrypt(keyMaterial, password)
    if (!isAccountData(decryptedData)) {
      throw new Error("Failed to decrypt keyMaterial or decrypted keyMaterial is invalid")
    }
    // @ts-ignore TODO: some type work here
    return { password, accountData: decryptedData }
  }

  /* Interactive Mode */
  let sucessfulPassword: string
  let decryptedData
  let attempts = 0

  while (attempts < 3) {
    const answers = await inquirer.prompt([
      {
        type: 'password',
        name: 'password',
        message: 'Enter password to decrypt keyMaterial:',
        mask: '*',
      }
    ])

    try {
      decryptedData = decrypt(keyMaterial, answers.password)
      //@ts-ignore
      if (!isAccountData(decryptedData)) {
        throw new Error("Failed to decrypt keyMaterial or decrypted keyMaterial is invalid")
      }

      sucessfulPassword = answers.password
      break
    } catch (error) {
      console.error("Incorrect password. Try again")
      attempts++
      if (attempts >= 3) {
        throw new Error("Failed to decrypt keyMaterial after 3 attempts.")
      }
    }
  }

  return {
    password: sucessfulPassword,
    accountData: decryptedData as AccountData
  }
}

function isAccountData (maybeAccountData: any) {
  return (
    maybeAccountData &&
    typeof maybeAccountData === 'object' &&
    'seed' in maybeAccountData
  )
}
