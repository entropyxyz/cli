import test from 'tape'

import migrations from '../../src/config/migrations'
import { migrateData, isValidConfig } from '../../src/config'

function makeConfig (override?: object) {
  const config = {
    accounts: [makeConfigAccount()],
    "selectedAccount": "naynay",
    "endpoints": {
      "dev": "ws://127.0.0.1:9944",
      "test-net": "wss://testnet.entropy.xyz",
      "stg": "wss://api.staging.testnet.testnet-2024.infrastructure.entropy.xyz"
    },
    "migration-version": 4,
  }

  if (override) {
    return { ...config, ...override }
    // NOTE: shallow merge
  }
  else return config
}

function makeConfigAccount (override?: object) {
  const configAccount = {
    "name": "naynay",
    "address": "5Cfxtz2fA9qBSF1QEuELbyy41JNwai1mp9SrDaHj8rR9am8S",
    "data": {
      "debug": true,
      "seed": "0x89bf4bc476c0173237ec856cdf864dfcaff0e80d87fb3419d40100c59088eb92",
      "admin": {
        "address": "5Cfxtz2fA9qBSF1QEuELbyy41JNwai1mp9SrDaHj8rR9am8S",
        "type": "registration",
        "verifyingKeys": [],
        "userContext": "ADMIN_KEY",
        "seed": "0x89bf4bc476c0173237ec856cdf864dfcaff0e80d87fb3419d40100c59088eb92",
        "path": "",
        "pair": {
          "address": "5Cfxtz2fA9qBSF1QEuELbyy41JNwai1mp9SrDaHj8rR9am8S",
          "addressRaw": "data:application/UI8A;base64,GuQ30RLMK/WEPz+g1qoliXGcRH7lk20/xHY0qvjdz08=",
          "isLocked": false,
          "meta": {},
          "publicKey": "data:application/UI8A;base64,GuQ30RLMK/WEPz+g1qoliXGcRH7lk20/xHY0qvjdz08=",
          "type": "sr25519",
          "secretKey": "data:application/UI8A;base64,aCCXH0+nI2+tot94NPegNBCwe1bWgw57xPo9Iss2DmoE5obkxD5JUXujRpsHEoltI0hD9SAUGO9GeV+8rGEkUg=="
        }
      },
      "registration": {
        "address": "5Cfxtz2fA9qBSF1QEuELbyy41JNwai1mp9SrDaHj8rR9am8S",
        "type": "registration",
        "verifyingKeys": [
          "0x02ecbc1c6777e868c8cc50c9784e95d3a4727bdb5a04d7694d2880c980f15e17c3"
        ],
        "userContext": "ADMIN_KEY",
        "seed": "0x89bf4bc476c0173237ec856cdf864dfcaff0e80d87fb3419d40100c59088eb92",
        "path": "",
        "pair": {
          "address": "5Cfxtz2fA9qBSF1QEuELbyy41JNwai1mp9SrDaHj8rR9am8S",
          "addressRaw": "data:application/UI8A;base64,GuQ30RLMK/WEPz+g1qoliXGcRH7lk20/xHY0qvjdz08=",
          "isLocked": false,
          "meta": {},
          "publicKey": "data:application/UI8A;base64,GuQ30RLMK/WEPz+g1qoliXGcRH7lk20/xHY0qvjdz08=",
          "type": "sr25519",
          "secretKey": "data:application/UI8A;base64,aCCXH0+nI2+tot94NPegNBCwe1bWgw57xPo9Iss2DmoE5obkxD5JUXujRpsHEoltI0hD9SAUGO9GeV+8rGEkUg=="
        }
      }
    }
  }

  if (override) {
    return { ...configAccount, ...override }
    // NOTE: shallow merge
  }
  else return configAccount
}


test('config - isValidConfig', t => {
  t.false(isValidConfig({}), 'empty object => false')
  const initialState = migrateData(migrations)

  function sweetAs (config, msg) {
    const isValid = isValidConfig(config)
    t.true(isValid, msg)
    if (!isValid) {
      console.error(isValidConfig.errors)
      console.error(config)
    }
  }

  sweetAs(initialState, 'initial state => true')

  console.log('---')

  /* accounts */
  {
    const configAccountsMissing = makeConfig({ accounts: undefined })
    t.false(isValidConfig(configAccountsMissing), "accounts: ommitted => false")

    /* account.name */
    {
      const configAccountNameUndefined = makeConfig({ 
        accounts: [
          makeConfigAccount({ name: undefined })
        ]
      })
      t.false(isValidConfig(configAccountNameUndefined), "accounts[0].name: undefined => false")

      const configAccountNameBad = makeConfig({ 
        accounts: [
          makeConfigAccount({ name: 4 })
        ]
      })
      t.false(isValidConfig(configAccountNameBad), "accounts[0].name: 4 => false")
    }

    /* account.address */
    {
      const configAccountAddressUndefined = makeConfig({ 
        accounts: [
          makeConfigAccount({ address: undefined })
        ]
      })
      t.false(isValidConfig(configAccountAddressUndefined), "accounts[0].address: undefined => false")

      const configAccountAddressBad = makeConfig({ 
        accounts: [
          makeConfigAccount({ address: 'doop' })
        ]
      })
      t.false(isValidConfig(configAccountAddressBad), "accounts[0].address: doop => false")
    }

    /* account.data */
    {
      const configAccountDataUndefined = makeConfig({ 
        accounts: [
          makeConfigAccount({ address: undefined })
        ]
      })
      t.false(isValidConfig(configAccountDataUndefined), "accounts[0].data: undefined => false")

      const configAcountDataAdminUndefined = makeConfig()
      // @ts-expect-error
      delete configAcountDataAdminUndefined.accounts[0].data.admin
      t.false(isValidConfig(configAcountDataAdminUndefined), "accounts[0].data.admin: undefined => false")

      const configAcountDataRegistrationUndefined = makeConfig()
      // @ts-expect-error
      delete configAcountDataRegistrationUndefined.accounts[0].data.registration
      t.false(isValidConfig(configAcountDataRegistrationUndefined), "accounts[0].data.registration: undefined => false")

      // TODO: define more closely which data we expect / require / need
      // NOTE: should do this after keyring work
    }

  }

  console.log('---')

  /* selectedAccount */
  {
    const config = makeConfig()

    // @ts-expect-error
    config.selectedAccount = undefined
    // TODO: this should be valid?!
    t.false(isValidConfig(config), "selectedAccount: ommitted => false")

    config.selectedAccount = ""
    // TODO: change this, it seems crazy to me!
    sweetAs(config, "selectedAccount: '' => true")

    // @ts-expect-error
    config.selectedAccount = 100
    t.false(isValidConfig(config), "selectedAccount: 100 => false")

    config.selectedAccount = "noonoo"
    t.false(isValidConfig(config), "selectedAccount: noonoo (does not match named account) => false")
  }

  console.log('---')

  /* endpoints */
  {
    const config = makeConfig()

    /* Custom endpoint */

    // @ts-expect-error
    config.endpoints.mixmix = "wss://testnet.mixmix.xyz"
    sweetAs(config, "endpoints: custom valid endpoint (wss) => true")

    // @ts-expect-error
    config.endpoints.mixmix = "ws://testnet.mixmix.xyz"
    sweetAs(config, "endpoints: custom valid endpoint (ws) => true")

    // @ts-expect-error
    config.endpoints.mixmix = "ws://testnet.mixmix.xyz"
    sweetAs(config, "endpoints: custom valid endpoint (ws) => true")

    // @ts-expect-error
    config.endpoints.mixmix = "http://testnet.mixmix.xyz"
    t.false(isValidConfig(config), "endpoints: invalid endpoint => false")

    // @ts-expect-error
    delete config.endpoints.mixmix

    /* Required endpoints */

    // @ts-expect-error
    delete config.endpoints["test-net"]
    t.false(isValidConfig(config), "endpoints: no 'test-net' => false")

    // @ts-expect-error
    delete config.endpoints
    t.false(isValidConfig(config), "endpoints: ommitted => false")

  }

  console.log('---')

  /* migration-version */
  {
    const config = makeConfig({ 'migration-version': undefined })
    t.false(isValidConfig(config), "migration-version: ommitted => false")

    config['migration-version'] = 99
    t.false(isValidConfig(config), "migration-version: wrong number => false")

    // @ts-expect-error
    config['migration-version'] = "4"
    t.false(isValidConfig(config), "migration-version: string int => false")

    // @ts-expect-error
    config['migration-version'] = "dog"
    t.false(isValidConfig(config), "migration-version: string => false")
  }

  console.log('---')

  /* Errors */
  {
    const config = makeConfig()
    isValidConfig(config)
    t.equal(isValidConfig.errors, null, 'isValidCOnfig.errors')

    // @ts-expect-error
    delete config["migration-version"]
    // @ts-expect-error
    delete config.endpoints["test-net"]
    isValidConfig(config)
    t.deepEqual(
      isValidConfig.errors,
      [
        {
          instancePath: '',
          schemaPath: '#/required',
          keyword: 'required',
          params: { missingProperty: 'migration-version' },
          message: "must have required property 'migration-version'"
        },
        {
          instancePath: '/endpoints',
          schemaPath: '#/properties/endpoints/required',
          keyword: 'required',
          params: { missingProperty: 'test-net' },
          message: "must have required property 'test-net'"
        }
      ],
      'isValidCOnfig.errors'
    )
  }

  t.end()
})

