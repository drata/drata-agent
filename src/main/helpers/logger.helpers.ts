import electronLog from 'electron-log';
import safeStringify from 'fast-safe-stringify';
import { get, isArray, isEmpty, isNil } from 'lodash';
import { EOL } from 'os';
import { MainBridge } from '../../bridge/main-bridge';
import { BUILD } from '../../constants/environment';
import { HTTPLogContext } from '../../types/http-log-context';
import { LogContext } from '../../types/log-context.type';
import { DataStoreHelper } from './data-store.helper';

// set console output format to be the same as file output
electronLog.transports.console.format =
    '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}';

export class Logger {
    private context: string;
    private dataStore = DataStoreHelper.instance;

    constructor(context: string) {
        this.context = context;

        if (!BUILD.PACKED) {
            // for dev env disable writing to log file
            electronLog.transports.file.level = false;
        } else {
            // for prod env disable logging to console
            electronLog.transports.console.level = false;
        }
    }

    info(...args: any) {
        this.infoOrWarn(electronLog.info, args);
    }

    warn(...args: any) {
        this.infoOrWarn(electronLog.warn, args);
    }

    private infoOrWarn(
        targetMethod: (...args: any[]) => void,
        args: any[],
    ): void {
        const message: string = args
            .map(param =>
                typeof param === 'object'
                    ? safeStringify(param, undefined, 2)
                    : param,
            )
            .join(' ');

        targetMethod(this.prependContext(message));
    }

    error(error: any, context?: LogContext) {
        const message = this.prependContext(error.message);

        let httpContext: HTTPLogContext | undefined;

        if (error.isAxiosError) {
            const status = get(error, 'response.data.statusCode');
            const code = get(error, 'response.data.code');
            const method = get(error, 'config.method');
            const url = get(error, 'config.url');

            httpContext = {
                status,
                code,
                method,
                url,
            };
        }

        const _error = new Error(message);

        const stack = error.stack?.split(EOL);
        if (isArray(stack)) {
            stack[0] = message;
            _error.stack = stack.join(EOL);
        }

        electronLog.error(_error);

        if (!isNil(context) || !isNil(httpContext)) {
            this.info(
                'The following context was provided for the previous error:',
                context ?? '',
                httpContext ?? '',
            );
        }

        this.reportError(_error, context, httpContext);
    }

    private prependContext(message?: string) {
        return `<${!isEmpty(this.context) ? this.context : 'DrataAgent'}>: ${
            isNil(message) ? '' : message
        }`;
    }

    private reportError(
        error: any,
        context?: LogContext,
        httpContext?: HTTPLogContext,
    ) {
        if (!(error instanceof Error)) {
            return;
        }

        const contextToAdd: Record<string, LogContext | undefined> = {};
        contextToAdd.error = safeStringify(context);
        contextToAdd.debug = this.dataStore.get('debugInfo');
        contextToAdd.HTTP = httpContext;

        // Send error through DD RUM SDK in renderer process
        MainBridge.instance?.sendMessage('addError', {
            // retain stack and context
            message: error.message,
            stack: error.stack,
            context: isEmpty(contextToAdd) ? undefined : contextToAdd,
        });
    }
}
