import { Command } from "commander"
import { EntropyTemplate } from "./main"
import { cliWrite, accountOption, endpointOption, loadEntropy, passwordOption } from "../common/utils-cli";


const command = {
  name: 'transfer'
  alias: ['']
  description: 'Transfer funds between two Entropy accounts.'
  // should be order
  args: [
    {name: 'destination',  description: 'Account address funds will be sent to'},
    {name: 'ammount',  description: 'Amount of funds to be moved'},
  ],
  optionFlags: [
    endpointOption
    ],

}


export function entropyTeplateCommand () {
  const transferCommand = new Command('tranfer')
  transferCommand
    .description(command.description) // TODO: name the output
    .argument('destination', 'Account address funds will be sent to')
    .argument('amount', 'Amount of funds to be moved')
    .addOption(passwordOption('Password for the source account (if required)'))
    .addOption(endpointOption())
    .addOption(accountOption())
    .action(async (destination, amount, opts) => {
      // load entropy
      const entropy = await loadEntropy(opts.account, opts.endpoint)
      // create service
      const transferService = new EntropyTransfer(entropy, opts.endpoint)
      // use sevice
      await transferService.transfer(destination, amount)
      // cliWrite(??) // TODO: write the output
      process.exit(0)
    })
  return transferCommand
}
