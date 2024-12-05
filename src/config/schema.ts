import migrations from './migrations'

const currentVersion = migrations.at(-1).version

const accountSchema = {
  type: "object",
  properties: {
    name: {
      type: "string"
    },
    address: {
      type: "string",
      pattern: [
        "^[",
        "a-k", /* l, */ "m-z",
        "A-H", /* I, */ "J-N", /* O, */ "P-Z",
        /* 0 */ "1-9",
        "]{48,48}$"
      ].join("")
      // base58: https://en.wikipedia.org/wiki/Binary-to-text_encoding#Encoding_standards
      //
      // Similar to Base64, but modified to avoid both non-alphanumeric characters (+ and /) and letters
      // that might look ambiguous when printed (0 – zero, I – capital i, O – capital o and l – lower-case L).
    },
    data: {
      type: "object",
      properties: {
        admin: { type: "object" },
        registration: { type: "object" }
      },
      required: ["admin", "registration"]
    }
  },
  required: ["name", "address", "data"]
}

export const configSchema = {
  type: "object",
  properties: {
    accounts: {
      type: "array",
      items: accountSchema,
      uniqueItems: true
    },
    selectedAccount: {
      type: "string"
    },
    endpoints: {
      type: "object",
      patternProperties: {
        "^\\w+$": {
          type: "string",
          pattern: "^wss?://"
        },
      },
      required: ["test-net"]
    },
    "migration-version": {
      type: "integer",
      minimum: currentVersion,
      maximum: currentVersion
    }
  },
  required: ["accounts", "selectedAccount", "endpoints", "migration-version"]
}

