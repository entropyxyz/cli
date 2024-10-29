import test from 'tape'
import { jumpStartNetwork } from '@entropyxyz/sdk/testing'

import { promiseRunner, eveSeed, setupTest } from './testing-utils'
import { EntropyProgram } from '../src/program/main'

const networkType = 'four-nodes'
const endpoint = 'ws://127.0.0.1:9944'

test('program', async t => {
  const { run, entropy } = await setupTest(t, { seed: eveSeed, networkType })
  await run('jump-start network', jumpStartNetwork(entropy))
  await run('register', entropy.register()) // TODO: consider removing this in favour of just testing add

  const program = new EntropyProgram(entropy, endpoint)

  let programPointer1

  t.test('program - deploy', async t => {
    const run = promiseRunner(t)

    programPointer1 = await run (
      'deploy!',
      program.deploy({
        bytecodePath: './tests/programs/program_noop.wasm'
      })
    )

    t.end()
  })

  const getPrograms = () => program.list({ verifyingKey: entropy.programs.verifyingKey })
  const verifyingKey = entropy.programs.verifyingKey

  t.test('program - add', async t => {
    const run = promiseRunner(t)

    const programsBeforeAdd = await run('get programs initial', getPrograms())
    t.equal(programsBeforeAdd.length, 1, 'eve has 1 program')

    await run(
      'adding program',
      program.add({
        programPointer: programPointer1,
        programConfig: ''
      })
    )
    const programsAfterAdd = await run('get programs after add', getPrograms())
    t.equal(programsAfterAdd.length, 2, 'eve has 2 programs')

    t.end()
  })

  t.test('program - remove', async t => {
    const run = promiseRunner(t)

    const programsBeforeRemove = await run('get programs initial', getPrograms())
    t.equal(programsBeforeRemove.length, 2, 'eve has 2 programs')

    await run(
      'removing noop program',
      program.remove({
        programPointer: programPointer1,
        verifyingKey
      })
    )
    const programsAfterRemove = await run('get programs initial', getPrograms())
    t.equal(programsAfterRemove.length, 1, 'eve has 1 less program')

    t.end()
  })

  t.test('program - view', async t => {
    const run = promiseRunner(t)

    const programs = await run(
      'get eve programs',
      program.list({ verifyingKey })
    )

    t.equal(programs.length, 1, 'eve has 1 program')

    t.end()
  })
})
