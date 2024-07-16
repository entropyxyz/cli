import test from 'tape'
import { readFileSync } from 'node:fs'
import { charlieStashSeed, promiseRunner, setupTest } from './testing-utils'
import { AddProgramParams } from 'src/flows/user-program-management/types'
import { addProgram } from 'src/flows/user-program-management/add'
import { removeProgram } from 'src/flows/user-program-management/remove'

const networkType = 'two-nodes'

test('User Program Management', async t => {
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

  t.test('Add Program', async ap => {
    const runAp = promiseRunner(ap)

    const programsBeforeAdd = await runAp('get programs initial', entropy.programs.get(entropy.programs.verifyingKey))
    ap.equal(programsBeforeAdd.length, 1, 'charlie has 1 program')
    await runAp('adding program', addProgram(entropy, noopProgramInstance))
    const programsAfterAdd = await runAp('get programs after add', entropy.programs.get(entropy.programs.verifyingKey))
    ap.equal(programsAfterAdd.length, 2, 'charlie has 2 programs')
    ap.end()
  })

  t.test('Remove Program', async rp => {
    const runRp = promiseRunner(rp)
    const programsBeforeRemove = await runRp('get programs initial', entropy.programs.get(entropy.programs.verifyingKey))
  
    rp.equal(programsBeforeRemove.length, 2, 'charlie has 2 programs')
    await runRp('removing noop program', removeProgram(entropy, { programPointer: newPointer, verifyingKey: entropy.programs.verifyingKey }))
    const programsAfterRemove = await runRp('get programs initial', entropy.programs.get(entropy.programs.verifyingKey))
    rp.equal(programsAfterRemove.length, 1, 'charlie has 1 less program')
    rp.end()
  })
})