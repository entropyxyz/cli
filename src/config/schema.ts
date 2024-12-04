export const schema = {
  type: "object",
  properties: {
    accounts: {
      type: "array"
    },
    selectedAccount: {
      type: "string"
    },
    endpoints: {
      "type": "object"
    },
    "migration-version": {
      type: "number"
    }
  },
  required: ["accounts", "selectedAccount", "endpoints", "migration-version"]
}
