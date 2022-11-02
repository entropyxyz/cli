import inquirer, { ListQuestion } from 'inquirer';

const choices = ["Register", "Sign"];

const intro: ListQuestion = {
  type: "list",
  name: "action",
  message: "Select Action",
  pageSize: choices.length,
  choices: choices,
};

const main = async () => {
  const { action } = await inquirer.prompt(intro);
  switch (action) {
    case "Register":
      console.log("register");
      break;
    case "Sign":
      console.log("sign");
      break;
    default:
      throw new Error("invalid choice");
  }
};

main()