import { print } from "src/common/utils"

export function displayPrograms (programs): void {
  programs.forEach((program, index) => {
    print(`${index + 1}.`)
    print('Pointer:', program.program_pointer)
    print('Config:', parseProgramConfig(program.program_config))
  })
}

function parseProgramConfig (rawConfig: unknown) {
  if (typeof rawConfig !== 'string') return rawConfig
  if (!rawConfig.startsWith('0x')) return rawConfig

  const hex = rawConfig.slice(2)
  const utf8 = Buffer.from(hex, 'hex').toString()
  return JSON.parse(utf8)
}
