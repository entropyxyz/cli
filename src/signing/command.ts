import { Command, Option } from 'commander'
import { Entropy } from '@entropyxyz/sdk'
import { cliWrite, currentAccountAddressOption, endpointOption, passwordOption, reloadEntropy } from '../common/utils-cli'
import { EntropySign } from './main'

export async function entropySignCommand (entropy: Entropy, rootCommand: Command) {
  const signCommand = rootCommand.command('sign')
    .description('Commands for working with signing with the Entropy Network')

  entropySign(entropy, signCommand)
}

function entropySign (entropy: Entropy, signCommand: Command) {
  signCommand.command('sign')
    .description('Sign a message using the Entropy network. Output is a signature (string)')
    .argument('msg', 'Message or Path to Message you would like to sign')
    .addOption(passwordOption('Password for the source account (if required)'))
    .addOption(endpointOption())
    .addOption(currentAccountAddressOption())
    .addOption(
      new Option(
        '-r, --raw',
        'Signs the provided message using the Raw Signing method. Output is a signature (string)'
      )
    )
    .action(async (msg, opts) => {
      if (opts.accountAddress) {
        entropy = await reloadEntropy(
          entropy,
          opts.accountAddress,
          entropy.keyring.accounts.registration.address, opts.endpoint
        )
      }
      const SigningService = new EntropySign(entropy, opts.endpoint)
      // TO-DO: Add ability for raw signing here, maybe? new raw option can be used for the conditional
      /**
       * if (opts.raw) {
       *   implement raw sign here
       * }
       */
      const signature = await SigningService.signMessageWithAdapters({ msg, msgPath: msg })
      cliWrite(signature)
      process.exit(0)
    })
}