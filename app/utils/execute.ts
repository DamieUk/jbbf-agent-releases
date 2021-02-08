import {exec, execFile} from "child_process";
import logger from "./logger";
import {IAnyShape} from "global-shapes";
// @ts-ignore
import Shell from "node-powershell";
import fs from "fs";
import http from "http";

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
        reject(error);

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
  return new Promise((resolve, reject) => {
    execFile(filePath, params, {shell: true}, (err: any, data: any) => {
      if (err) {
        return reject(err);
      }
      return resolve(data);
    });
  });
}

export function executeScript<S extends string, P extends IAnyShape>(path: S, params?: P): Promise<any> {
  return new Promise((resolve, reject) => {
    const allParams: IAnyShape[] = [];
    const paramsInfo: string[] = [];
    const paramsKeys: string[] = params ? Object.keys(params) : [];
    if (paramsKeys.length) {
      paramsKeys.forEach(key => {
        if (params) {
          paramsInfo.push(`-${key} ${params[key]}`)
          allParams.push({name: key, value: params[key]});
        }
      })
    }

    const command = `${path} ${paramsInfo.join(' ')}`;
    logger.info(`Executing script ->>>> ${command}`);

    const ps = new Shell({
      executionPolicy: 'Bypass',
      noProfile: true
    });
    ps.addCommand(`& "${path}"`)
      // @ts-ignore
      .then(() => allParams.length && ps.addParameters(allParams))
      .then(() => {
        return ps.invoke()
          .then((response: any) => {
            const message = JSON.stringify(response);
            logger.info(`Command ->>> ${command} -<<< Successfully executed.`)
            resolve(message);
          })
          .catch((err: any) => {
            logger.info(`Command ->>> ${command} -<<< Failed execution. -----`, err)
            reject(err);
            ps.dispose();
          });
      })
  })
}

export const downloadScript = (url: string, dest: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    http.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();  // close() is async, call cb after close completes.
        resolve(dest);
      });
    }).on('error', (err) => { // Handle errors
      fs.unlink(dest, () => reject(err.message)); // Delete the file async. (But we don't check the result)
      reject(err.message)
    });
  })
};
