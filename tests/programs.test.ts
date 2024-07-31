import test from 'tape'

import { promiseRunner, charlieStashSeed, setupTest } from './testing-utils'
import { addProgram } from '../src/flows/programs/add'
import { viewPrograms } from '../src/flows/programs/view'
import { removeProgram } from '../src/flows/programs/remove'
import { deployProgram } from '../src/flows/programs/deploy'

const networkType = 'two-nodes'

test('programs', async t => {
  const { run, entropy } = await setupTest(t, { seed: charlieStashSeed, networkType })
  await run('register', entropy.register()) // TODO: consider removing this in favour of just testing add

  let programPointer1

  t.test('programs - deploy', async t => {
    const run = promiseRunner(t)

    programPointer1 = await run (
      'deploy!',
      deployProgram(entropy, {
        bytecodePath: './tests/programs/program_noop.wasm'
      })
    )

    t.end()
  })

  const getPrograms = () => entropy.programs.get(entropy.programs.verifyingKey)
  const verifyingKey = entropy.programs.verifyingKey

  t.test('programs - add', async t => {
    const run = promiseRunner(t)

    const programsBeforeAdd = await run('get programs initial', getPrograms())
    t.equal(programsBeforeAdd.length, 1, 'charlie has 1 program')

    await run(
      'adding program',
      addProgram(entropy, { programPointer: programPointer1, programConfig: '' })
    )
    const programsAfterAdd = await run('get programs after add', getPrograms())
    t.equal(programsAfterAdd.length, 2, 'charlie has 2 programs')

    t.end()
  })

  t.test('programs - remove', async t => {
    const run = promiseRunner(t)

    const programsBeforeRemove = await run('get programs initial', getPrograms())
    t.equal(programsBeforeRemove.length, 2, 'charlie has 2 programs')

    await run(
      'removing noop program',
      removeProgram(entropy, { programPointer: programPointer1, verifyingKey })
    )
    const programsAfterRemove = await run('get programs initial', getPrograms())
    t.equal(programsAfterRemove.length, 1, 'charlie has 1 less program')

    t.end()
  })

  t.test('programs - view', async t => {
    const run = promiseRunner(t)

    const programs = await run(
      'get charlie programs',
      viewPrograms(entropy, { verifyingKey })
    )

    t.equal(programs.length, 1, 'charlie has 1 program')

    t.end()
  })
})
