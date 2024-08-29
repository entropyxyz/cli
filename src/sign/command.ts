import { Command, /* Option */ } from 'commander'
import { Entropy } from '@entropyxyz/sdk'
import { cliWrite, currentAccountAddressOption, endpointOption, passwordOption } from '../common/utils-cli'
import { EntropySign } from './main'

export async function entropySignCommand (entropy: Entropy, rootCommand: Command) {
  rootCommand.command('sign')
    .description('Sign a message using the Entropy network. Output is a JSON { verifyingKey, signature }')
    .argument('msg', 'Message you would like to sign (string)')
    .addOption(passwordOption('Password for the source account (if required)'))
    .addOption(endpointOption())
    .addOption(currentAccountAddressOption())
    // .addOption(
    //   new Option(
    //     '-r, --raw',
    //     'Signs the provided message using the Raw Signing method. Output is a signature (string)'
    //   )
    // )
    .action(async (msg, opts) => {
      const SigningService = new EntropySign(entropy, opts.endpoint)
      // TO-DO: Add ability for raw signing here, maybe? new raw option can be used for the conditional
      /**
       * if (opts.raw) {
       *   implement raw sign here
       * }
       */
      const { verifyingKey, signature } = await SigningService.signMessageWithAdapters({ msg })
      cliWrite({ verifyingKey, signature })
      process.exit(0)
    })
}
