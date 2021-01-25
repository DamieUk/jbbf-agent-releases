import {execFile, exec, spawn} from "child_process";
import logger from "./logger";


/**
 * @param {string} command A shell command to execute
 * @return {Promise<string>} A promise that resolve to the output of the shell command, or an error
 * @example const output = await execute("ls -alh");
 */
export function execute<C extends string>(command: C): Promise<string> {
  /**
   * @param {Function} resolve A function that resolves the promise
   * @param {Function} reject A function that fails the promise
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
   */
  return new Promise(function (resolve, reject) {
    /**
     * @param {Error} error An error triggered during the execution of the childProcess.exec command
     * @param {string|Buffer} standardOutput The result of the shell command execution
     * @param {string|Buffer} standardError The error resulting of the shell command execution
     * @see https://nodejs.org/api/child_process.html#child_process_child_process_exec_command_options_callback
     */
    exec(command, (error, standardOutput: string, standardError: string) => {
      if (error) {
        reject();

        return;
      }

      if (standardError) {
        reject(standardError);

        return;
      }

      logger.info(`Executed command "${command}". Output is -> `, standardOutput)

      resolve(standardOutput);
    });
  });
}

/**
 * Function to execute exe
 * @param {string} filePath The name of the executable file to run.
 * @param {string[]} params List of string arguments.
 * @param {string} path Current working directory of the child process.
 */
export function executeProgram(filePath: string, params?: any): Promise<string> {
  logger.info(`Executing ${filePath} ${JSON.stringify(params)}`)
  return new Promise((resolve, reject) => {
    execFile(filePath, params, { shell: true }, (err: any, data: any) => {
      if (err) {
        logger.error(err);
        return reject(err);
      }
      logger.info(`Executed ${filePath} ${JSON.stringify(params)}`);
      return resolve(data);
    });
  });
}

/**
 * @param {string} command A shell command to execute
 * @return {Promise<string>} A promise that resolve to the output of the shell command, or an error
 * @example const output = await execute("ls -alh");
 */
export function executeExeFile<C extends string, P extends string[]>(command: C, params?: P): Promise<string> {
  /**
   * @param {Function} resolve A function that resolves the promise
   * @param {Function} reject A function that fails the promise
   * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
   */
  return new Promise(function (resolve, reject) {
    /**
     * @param {Error} error An error triggered during the execution of the childProcess.exec command
     * @param {string|Buffer} standardOutput The result of the shell command execution
     * @param {string|Buffer} standardError The error resulting of the shell command execution
     * @see https://nodejs.org/api/child_process.html#child_process_child_process_exec_command_options_callback
     */

    const cp = spawn(command, params, {shell: true});

    cp.stdout.on('data', (data: any) => {
      logger.info('stdout: ' + data);
      resolve(data);
    });

    cp.stderr.on('data', (err: any) => {
      logger.error('stderr: ' + err);
      reject(err)
    });

  });
}
