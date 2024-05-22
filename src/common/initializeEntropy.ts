import Entropy, { wasmGlobalsReady } from "@entropyxyz/sdk"
// TODO: fix importing of types from @entropy/sdk/keys
// @ts-ignore
import Keyring from "@entropyxyz/sdk/keys"
import inquirer from "inquirer"
import { decrypt } from "../flows/password"
import { debug } from "../common/utils"

// TODO: unused
// let defaultAccount // have a main account to use
// let entropys 

// have a main keyring
const keyrings = {
  default: undefined
}
export function getKeyring (address) {
  if (!address && keyrings.default) return keyrings.default
  if (address && keyrings[address]) return keyrings[address]
  if (address && !keyrings[address]) throw new Error('No keyring for this account')
  if (!keyrings.default) throw new Error('no default set please create a keyring')
  return keyrings.default
}

// TODO: pull this type from somewhere else?
interface AccountData {
  type: string,
  seed: string
}
type MaybeKeyMaterial = AccountData | string

interface InitializeEntropyOpts {
  keyMaterial: MaybeKeyMaterial,
  password?: string,
  endpoint: string
}

// TODO: re-enable these?
// let defaultAccount 
// let entropys
// WARNING: in programatic cli mode this function should NEVER prompt users, but it will if no password was provided

export const initializeEntropy = async ({ keyMaterial, password, endpoint }: InitializeEntropyOpts): Promise<Entropy> => {
  debug('key material', keyMaterial);
  // if (defaultAccount && defaultAccount.seed === keyMaterial.seed) return entropys[defaultAccount.registering.address]
  await wasmGlobalsReady()

  const accountData = await getAccountData(keyMaterial, password)
  if (!accountData.seed) {
    throw new Error("Data format is not recognized as either encrypted or unencrypted")
  }
  debug('account:', accountData);

  let selectedAccount: Keyring
  if (!keyrings.default) {
    const keyring = new Keyring({ ...accountData, debug: true })
    keyrings.default = keyring
    selectedAccount = keyring
  } else {
    const keyring = new Keyring({ ...accountData, debug: true })
    keyrings[keyring.registering.address] = keyring
    selectedAccount = keyring
  }

  const entropy = new Entropy({ keyring: selectedAccount, endpoint })
  await entropy.ready

  debug('data sent', accountData);
  debug('storage', keyrings);
  debug('selected', selectedAccount);
  debug('keyring', entropy.keyring);

  if (!entropy?.keyring?.accounts?.registration?.seed) {
    throw new Error("Keys are undefined")
  }

  return entropy
}

async function getAccountData (keyMaterial: MaybeKeyMaterial, password?: string): Promise<AccountData> {
  if (isAccountData(keyMaterial)) return keyMaterial as AccountData

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
    return decryptedData
  }

  /* Interactive Mode */
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

      break
    } catch (error) {
      console.error("Incorrect password. Try again")
      attempts++
      if (attempts >= 3) {
        throw new Error("Failed to decrypt keyMaterial after 3 attempts.")
      }
    }
  }

  return decryptedData as { seed: string; type: string }
}

function isAccountData (maybeAccountData: any) {
  return (
    maybeAccountData &&
    typeof maybeAccountData === 'object' &&
    'seed' in maybeAccountData
  )
}
