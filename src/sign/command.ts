import { Command, /* Option */ } from 'commander'
import { accountOption, configOption, endpointOption, passwordOption, cliWrite, loadEntropy } from '../common/utils-cli'
import { EntropySign } from './main'

export function entropySignCommand () {
  const signCommand = new Command('sign')
    .description('Sign a message using the Entropy network. Output is a JSON { verifyingKey, signature }')
    .argument('msg', 'Message you would like to sign (string)')
    .addOption(accountOption())
    .addOption(configOption())
    .addOption(endpointOption())
    .addOption(passwordOption('Password for the source account (if required)'))
    // .addOption(
    //   new Option(
    //     '-r, --raw',
    //     'Signs the provided message using the Raw Signing method. Output is a signature (string)'
    //   )
    // )
    .action(async (msg, opts) => {
      const entropy = await loadEntropy(opts)
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
  return signCommand
}
