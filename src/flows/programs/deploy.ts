import Entropy from "@entropyxyz/sdk";
import fs from "node:fs/promises"
import { isAbsolute, join } from "node:path"
import { u8aToHex } from "@polkadot/util"

import { DeployProgramParams } from "./types"

export async function deployProgram (entropy: Entropy, params: DeployProgramParams) {
  const bytecode = await loadFile(params.bytecodePath)
  const configurationSchema = await loadFile(params.configurationSchemaPath, 'json')
  const auxillaryDataSchema = await loadFile(params.auxillaryDataSchemaPath, 'json')
  // QUESTION: where / how are schema validated?

  return entropy.programs.dev.deploy(
    bytecode,
    jsonToHex(configurationSchema),
    jsonToHex(auxillaryDataSchema)
  )
}

function loadFile (path?: string, encoding?: string) {
  if (path === undefined) return

  const absolutePath = isAbsolute(path)
    ? path
    : join(process.cwd(), path)

  switch (encoding) {
  case undefined:
    return fs.readFile(absolutePath)

  case 'json':
    return fs.readFile(absolutePath, 'utf-8')
      .then(string => JSON.parse(string))

  default:
    throw Error('unknown encoding: ' + encoding)
    // return fs.readFile(absolutePath, encoding)
  }
}

function jsonToHex (obj?: object) {
  if (obj === undefined) return

  const encoder = new TextEncoder()
  const byteArray = encoder.encode(JSON.stringify(obj))

  return u8aToHex(new Uint8Array(byteArray))
}
