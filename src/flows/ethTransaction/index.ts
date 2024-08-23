import inquirer from "inquirer"
import { u8aToHex } from '@polkadot/util'
import { initializeEntropy } from "../../common/initializeEntropy"
import { getSelectedAccount, print } from "../../common/utils"
import { signWithAdapters } from "../sign/sign"
import { EntropyLogger } from "src/common/logger"

export async function ethTransaction ({ accounts, selectedAccount: selectedAccountAddress }, options, logger: EntropyLogger) {
    const FLOW_CONTEXT = 'SIGN'
    const { endpoint } = options
  
    const selectedAccount = getSelectedAccount(accounts, selectedAccountAddress)
    logger.debug("selectedAccount:", FLOW_CONTEXT)
    logger.debug(selectedAccount, FLOW_CONTEXT)
    const keyMaterial = selectedAccount?.data;
  
    const entropy = await initializeEntropy({ keyMaterial, endpoint })
    const { address } = entropy.keyring.accounts.registration
    logger.debug("address:", FLOW_CONTEXT)
    logger.debug(address, FLOW_CONTEXT)
    if (address == undefined) {
      throw new Error("address issue")
    }

    const msg = Buffer.from('Hello world: new signature from entropy!').toString('hex')
    // debug('msg', msg);
    const signature = await entropy.sign({
        sigRequestHash: msg,
        hash: 'keccak',
        auxiliaryData: [
        {
            public_key_type: 'sr25519',
            public_key: Buffer.from(entropy.keyring.accounts.registration.pair.publicKey).toString('base64'),
            signature: entropy.keyring.accounts.registration.pair.sign(msg),
            context: 'substrate',
        },
        ],
    })

    print('signature:', signature)
    return
  }
  