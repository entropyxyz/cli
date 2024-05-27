/*

{
  type: (String) Type of the prompt. Defaults: input - Possible values: input, number, confirm, list, rawlist, expand, checkbox, password, editor
  name: (String) The name to use when storing the answer in the answers hash. If the name contains periods, it will define a path in the answers hash.
  message: (String|Function) The question to print. If defined as a function, the first parameter will be the current inquirer session answers. Defaults to the value of name (followed by a colon).
  default: (String|Number|Boolean|Array|Function) Default value(s) to use if nothing is entered, or a function that returns the default value(s). If defined as a function, the first parameter will be the current inquirer session answers.
  choices: (Array|Function) Choices array or a function returning a choices array. If defined as a function, the first parameter will be the current inquirer session answers. Array values can be simple numbers, strings, or objects containing a name (to display in list), a value (to save in the answers hash), and a short (to display after selection) properties. The choices array can also contain a Separator.
  validate: (Function) Receive the user input and answers hash. Should return true if the value is valid, and an error message (String) otherwise. If false is returned, a default error message is provided.
  filter: (Function) Receive the user input and answers hash. Returns the filtered value to be used inside the program. The value returned will be added to the Answers hash.
  transformer: (Function) Receive the user input, answers hash and option flags, and return a transformed value to display to the user. The transformation only impacts what is shown while editing. It does not modify the answers hash.
  when: (Function, Boolean) Receive the current user answers hash and should return true or false depending on whether or not this question should be asked. The value can also be a simple boolean.
  pageSize: (Number) Change the number of lines that will be rendered when using list, rawList, expand or checkbox.
  prefix: (String) Change the default prefix message.
  suffix: (String) Change the default suffix message.
  askAnswered: (Boolean) Force to prompt the question if the answer already exists.
  loop: (Boolean) Enable list looping. Defaults: true
  waitUserInput: (Boolean) Flag to enable/disable wait for user input before opening system editor - Defaults: true
}

const list = {}
const confirm

export const returnToMain = {
  type: "confirm",
  name: "returnToMain",
  message: "Return to main menu?",
  default: true,
}

export const intro = {
  type: "list",
  name: "action",
  message: "Select Action",
  pageSize: choices.length,
  choices: choices,
}

*/
