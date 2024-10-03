import test from 'tape'
import { Command, Option } from 'commander'

test.only('too many opts on the dance floor', async (t) => {
  const accountOption = () => {
    return new Option('-a, --account <name|address>')
      .argParser((str) => str.toUpperCase())
      .default('DERP')
  }

  const program = new Command()
    .addOption(accountOption())

  const danceCommand = new Command('dance')
    // .addOption(accountOption())
  program.addCommand(danceCommand)

  const input = 'dance --account naynay'
  await program.parseAsync(input.split(' '), { from: 'user' })
  program.parseAsync


  t.deepEqual(
    program.opts(),
    { account: 'NAYNAY' }
  )
  // ✓

  t.deepEqual(
    danceCommand.opts(),
    { account: 'NAYNAY' }
  )
  // ✗ gets { account: 'DERP' }

  t.end()
})
