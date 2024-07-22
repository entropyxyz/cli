import { print } from "src/common/utils"

export function displayPrograms (programs): void {
  programs.forEach((program, index) => {
    print(
      `${index + 1}. Pointer: ${
        program.program_pointer
      }, Config: ${JSON.stringify(program.program_config)}`
    )
  })
}