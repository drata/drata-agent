import { exec, execFile, ExecFileOptions } from 'child_process';
import { isEmpty, trim } from 'lodash';
import { Platform } from '../../enums/platform.enum';
import { Logger } from './logger.helpers';
import { getPlatform } from './platform.helpers';
import { truncateString } from './string.helpers';

export class ProcessHelper {
    private static readonly logger = new Logger(
        ProcessHelper.prototype.constructor.name,
    );

    static async runQuery(
        osqueryiBinaryPath: string,
        query: string,
    ): Promise<string> {
        const result = await this.promiseExecFile(
            // leave this wrapped in double-quotes due to spaces in the path
            `"${osqueryiBinaryPath}"`,
            [query],
            {
                shell: true,
            },
        );

        return trim(result);
    }

    static async runCommand(command: string): Promise<string> {
        const result = await this.promiseExec(command);

        return trim(result);
    }

    /**
     * Promisified child_process.exec
     */
    private static promiseExec(command: string): Promise<string> {
        return new Promise((resolve, reject): void => {
            try {
                const platform = getPlatform();

                if (platform === Platform.WINDOWS) {
                    // Using UTF-8 code page identifier (65001) in current execution in order to encode strings correctly
                    command = 'cmd /c chcp 65001>nul && ' + command;
                }

                exec(command, (error, stdout, stderr) => {
                    if (error) {
                        return reject(error);
                    }

                    if (!isEmpty(stderr)) {
                        return reject(new Error(stderr.toString()));
                    }

                    resolve(stdout.toString());
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Promisified child_process.execFile
     */
    private static promiseExecFile(
        file: string,
        args: readonly string[] | null | undefined,
        options: ExecFileOptions,
    ): Promise<string> {
        return new Promise((resolve, reject): void => {
            try {
                execFile(file, args, options, (error, stdout, stderr) => {
                    if (error) {
                        return reject(error);
                    }

                    if (!isEmpty(stderr)) {
                        this.logger.info('Query info: ', {
                            args,
                            output: truncateString(stdout.toString(), 100),
                            info: stderr.toString(),
                        });
                    }

                    resolve(stdout.toString());
                });
            } catch (error) {
                reject(error);
            }
        });
    }
}
