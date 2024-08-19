import Entropy from "@entropyxyz/sdk";
import { BaseCommand } from "../common/base-command";
import { setupProgress } from "../common/progress";
import * as TransferUtils from './utils'
import inquirer from "inquirer";

const FLOW_CONTEXT = 'ENTROPY_TRANSFER'
const question = [
  {
    type: "input",
    name: "amount",
    message: "Input amount to transfer:",
    default: "1",
    validate: (amount) => {
      if (isNaN(amount) || parseInt(amount) <= 0) {
        return 'Please enter a value greater than 0'
      }
      return true
    }
  },
  {
    type: "input",
    name: "recipientAddress",
    message: "Input recipient's address:",
  },
]

export class TransferCommand extends BaseCommand {
  constructor (entropy: Entropy, endpoint: string) {
    super(entropy, endpoint, FLOW_CONTEXT)
    this.arguments = {
      source: {
      // cli grabs description for --help
      description: 'Account address funds will be sent to',
      // tui grabs message for interface
      message: "Input recipient's address:" }
    }
  }

  // decorateProgram (program) {
  //   program.command('transfer')
  // .description('Transfer funds between two Entropy accounts.') // TODO: name the output
  // .argument('source', 'Account address funds will be drawn from')
  // .argument('destination', 'Account address funds will be sent to')
  // .argument('amount', 'Amount of funds to be moved')
  // .addOption(passwordOption('Password for the source account (if required)'))
  // .addOption(endpointOption())
  // .addOption(currentAccountAddressOption())
  // .action(async (_source, destination, amount, opts) => {
  //   const transferCommand = new TransferCommand(entropy, opts.endpoint)
  //   await transferCommand.sendTransfer(destination, amount)
  //   // writeOut(??) // TODO: write the output
  //   process.exit(0)
  // })
  // return program
  // }

  public async askQuestions () {
    return inquirer.prompt(question)
  }

  public async sendTransfer (toAddress: string, amount: string) {
    const { start: startProgress, stop: stopProgress } = setupProgress('Transferring Funds')

    const formattedAmount = BigInt(parseInt(amount) * 1e10)
    startProgress()
    try {
      const transferStatus = await TransferUtils.transfer(this.entropy, { from: this.entropy.keyring.accounts.registration.pair, to: toAddress, amount: formattedAmount })
      if (transferStatus.isFinalized) return stopProgress()
    } catch (error) {
      this.logger.error('There was an issue sending this transfer', error)
      stopProgress()
      throw error
    }
  }
}