import test from 'tape'
import { readFileSync } from 'node:fs'
import { charlieSeed, charlieStashSeed, setupTest } from './testing-utils'
import { AddProgramParams } from 'src/flows/user-program-management/types'
import { addProgram } from 'src/flows/user-program-management/add'
import { viewPrograms } from 'src/flows/user-program-management/view'

const networkType = 'two-nodes'

test('User Program Management::Add Programs', async t => {
  const { run, entropy } = await setupTest(t, { seed: charlieStashSeed, networkType })
  await run('charlie stash register', entropy.register())
  const noopProgram: any = readFileSync(
    'src/programs//program_noop.wasm'
  )
  const newPointer = await run(
    'deploy',
    entropy.programs.dev.deploy(noopProgram)
  )

  const noopProgramInstance: AddProgramParams = {
    programPointer: newPointer,
    programConfig: '',
  }

  const programsBeforeAdd = await run('get programs initial', entropy.programs.get(entropy.programs.verifyingKey))
  t.equal(programsBeforeAdd.length, 1, 'charlie has 1 program')
  await run('adding program', addProgram(entropy, noopProgramInstance))
  const programsAfterAdd = await run('get programs after add', entropy.programs.get(entropy.programs.verifyingKey))
  t.equal(programsAfterAdd.length, 2, 'charlie has 2 programs')

  t.end()
})

test('User Program Management::View Programs', async t => {
  const { run, entropy } = await setupTest(t, { seed: charlieSeed, networkType })

  await run('charlie register', entropy.register())
  const programs = await run('get charlie programs', viewPrograms(entropy, { verifyingKey: entropy.programs.verifyingKey }))

  t.equal(programs.length, 1, 'charlie has 1 program')
  t.end()
})