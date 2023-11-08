import { spawn, spawnSync } from 'child_process';
import inquirer from 'inquirer';
import { returnToMain } from '../../common/utils';

const startDockerCompose = (dockerComposeFile: string) => {
  const startCmd = spawn('docker-compose', ['-f', dockerComposeFile, 'up', '--detach'], {
    shell: true,
    detached: true
  });

  startCmd.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });

  startCmd.on('close', (code) => {
    if (code === 0) {
      console.log("Entropy started successfully.");
    } else {
      console.log(`Child process exited with code ${code}`);
    }
  });

  return startCmd;
};

const killDockerCompose = (dockerComposeFile: string) => {
  spawnSync('docker-compose', ['-f', dockerComposeFile, 'down'], { shell: true, stdio: 'inherit' });
  console.log("Entropy stopped successfully.");
};

const openNewTerminal = (dockerComposeFile: string) => {
  const command = `tell application "Terminal" to do script "cd ${process.cwd()} && docker-compose -f ${dockerComposeFile} up"`;
  spawn('osascript', ['-e', command]);
};

export const startEntropy = async (): Promise<string> => {
  try {
    const dockerComposeFile = "src/common/docker-compose.yaml";
    console.log("Preparing to start Entropy...");

    const { openNewTerminal: openInNewTerminal } = await inquirer.prompt([{
      type: 'confirm',
      name: 'openNewTerminal',
      message: 'Do you want to spin up Entropy in a new terminal?',
      default: false
    }]);

    if (openInNewTerminal) {
      openNewTerminal(dockerComposeFile);
      return "Entropy started in a new terminal.";
    } else {
      startDockerCompose(dockerComposeFile);
      return "Entropy started.";
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Failed to start the Entropy: ${error.message}`);
      return `Failed to start Entropy: ${error.message}`;
    } else {
      console.error(`An unexpected error occurred: ${String(error)}`);
      return "An unexpected error occurred.";
    }
  }
};

// Execute the function when the script is called
if (require.main === module) {
  startEntropy();
}
