import { app } from 'electron';
import { get, isNil } from 'lodash';
import qs from 'qs';
import pkg from '../../../../package.json';
import { BUILD, PLATFORM } from '../../../constants/environment';
import { ProtocolSchema } from '../../../enums/protocol-schema.enum';
import { ProtocolArgs } from '../../../types/protocol-args.type';
import { ServiceBase } from '../service-base.service';

/**
 * Handle the protocols registered by the Agent on a system level
 *
 * To trigger a protocol you can for example click on a link like
 *   *\<a href="protocolShema://arg1=some_value&arg2=some_other_value">Link message\</a>*
 *
 * The protocols are registered by electron-build through the configuration on package.json under build.protocols
 * To register a new protocol just add it there. That config will be pulled into the DeepLink service.
 */
export class DeepLinkService extends ServiceBase {
    private listeners: Record<
        string,
        Array<(...args: any[]) => Promise<void>>
    > = {};

    constructor() {
        super();
        this.registerProtocols();
    }

    on<T>(
        protocolSchema: ProtocolSchema,
        callback: (args: T) => Promise<void>,
    ) {
        if (BUILD.UNPACKED) {
            this.logger.warn(
                "Deep link handling doesn't work on unpacked apps.",
            );
        }

        if (isNil(this.listeners[protocolSchema])) {
            this.listeners[protocolSchema] = [];
        }

        this.listeners[protocolSchema].push(callback);
    }

    private registerProtocols(): void {
        if (PLATFORM.MACOS) {
            app.on('open-url', (event, protocol) => {
                event.preventDefault();

                if (!isNil(protocol)) {
                    this.logger.info(`Protocol ${protocol} execution captured`);
                    const parsed = this.resolveProtocol(protocol);
                    this.storeCapturedProtocol(parsed);
                    this.emit(parsed);
                }
            });
        }

        if (PLATFORM.WINDOWS || PLATFORM.LINUX) {
            const protocolSchemaNames: string[] = get(
                pkg,
                'build.protocols.schemes',
                [],
            );

            protocolSchemaNames.forEach((protocol: string) =>
                app.setAsDefaultProtocolClient(protocol),
            );

            // check if this is the primary instance of the app, otherwise close it
            const isPrimaryInstance = app.requestSingleInstanceLock();
            if (!isPrimaryInstance) {
                app.quit();
                return;
            }

            // only the primary instance of the application will run this code
            app.on('second-instance', (event, args) => {
                event.preventDefault();
                // number of args can variate, therefore we need to search for the one we want
                const protocol = !isNil(args)
                    ? args.find(arg => arg.includes('://'))
                    : undefined;

                if (!isNil(protocol)) {
                    this.logger.info(
                        `Protocol ${protocol} execution captured with ${args}`,
                    );

                    const parsed = this.resolveProtocol(protocol);
                    this.storeCapturedProtocol(parsed);
                    this.emit(parsed);
                }
            });
        }
    }

    private resolveProtocol(protocol: string): ProtocolArgs {
        const [protocolSchema, rawArgs] = protocol.split('://');
        let args = qs.parse(rawArgs) as ProtocolArgs['args'];

        // known issue with some environments adding trailing slash to last argument
        const lastEntry = Object.entries(args).pop();
        args = {
            ...args,
            [lastEntry?.[0] as any]: lastEntry?.[1].replace(/\/$/, ''),
        };

        return {
            protocolSchema,
            args,
        };
    }

    private emit({ protocolSchema, args }: ProtocolArgs) {
        const listeners = this.listeners[protocolSchema];
        if (!isNil(listeners)) {
            listeners.forEach(async listener => {
                await listener(args);
            });
        }
    }

    /**
     * Store the protocol in case it's needed later
     * @param protocol
     */
    private storeCapturedProtocol(protocol: ProtocolArgs) {
        this.dataStore.set('capturedProtocol', protocol);
    }
}
