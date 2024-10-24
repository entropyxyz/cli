
// These are for interaction.ts
// - content is grouped by flow (e.g. "add")
//   - then questions within that flow
//
// This makes our code easy to import into translation tools in the future
// and keeps the groupings in line with the UI

export const PROMPT = {
  learn: {
    byteCodePath: {
      name: "byteCodePath",
      // NOTE: this is a duplicate of the parent key. A little messy, but works for the moment
      message: "please give the path your dance's bytecode"
    }
  },
  add: {
    dancePointer: {
      name: "dancePointer",
      message: "please give the pointer to your dance"
    },
    danceConfigPath: {
      name: "danceConfigPath",
      message: "please give the path your dance's config (as JSON)"
    }
  }
}
