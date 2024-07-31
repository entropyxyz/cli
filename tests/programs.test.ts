import test from 'tape'
import { readFileSync } from 'node:fs'

import { promiseRunner, charlieStashSeed, setupTest } from './testing-utils'
import { addProgram } from '../src/flows/programs/add'
import { viewPrograms } from '../src/flows/programs/view'
import { removeProgram } from '../src/flows/programs/remove'
import { AddProgramParams } from '../src/flows/programs/types'

const networkType = 'two-nodes'

test('programs', async t => {
  const { run, entropy } = await setupTest(t, { seed: charlieStashSeed, networkType })
  await run('charlie stash register', entropy.register())
  const noopProgram: any = readFileSync(
    new URL('./programs/program_noop.wasm', import.meta.url)
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

  t.test('View Program', async vp => {
    const runVp = promiseRunner(vp)
    const programs = await runVp('get charlie programs', viewPrograms(entropy, { verifyingKey: entropy.programs.verifyingKey }))

    vp.equal(programs.length, 1, 'charlie has 1 program')
    vp.end()
  })
})
