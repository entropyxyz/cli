// Testnet address used to deploy program on chain
// Used to derive various accounts registered to faucet program in order to be used for
// issuing Faucet Funds
export const FAUCET_PROGRAM_MOD_KEY = '5GWamxgW4XWcwGsrUynqnFq2oNZPqNXQhMDfgNH9xNsg2Yj7'
// Faucet program pointer
// To-DO: Look into deriving this program from owned programs of Faucet Program Mod Acct
// this is differnt from tests because the fauce that is live now was lazily deployed without schemas
// TO-DO: update this when faucet is deployed properly 
export const TESTNET_PROGRAM_HASH = '0x12af0bd1f2d91f12e34aeb07ea622c315dbc3c2bdc1e25ff98c23f1e61106c77'
// Hash with max send of 1e10
export const LOCAL_PROGRAM_HASH = '0x5fa0536818acaa380b0c349c8e887bf269d593a47e30c8e31de53a75d327f7b1'