import { contextBridge, ipcRenderer } from 'electron';
import { BridgeChannel } from '../entities/bridge-channel.interface';

// This type is created so the return of the onMessage function is explicit about its purpose
type CancelListenerFn = () => void;

function onMessage<BCh extends keyof BridgeChannel>(
    channel: BCh,
    handler: (data: BridgeChannel[BCh]) => void,
): CancelListenerFn {
    const wrappedHandler = (
        _: Electron.IpcRendererEvent,
        arg: BridgeChannel[BCh],
    ): void => {
        handler(arg);
    };

    ipcRenderer.on(channel.toString(), wrappedHandler);
    return () => ipcRenderer.removeListener(channel.toString(), wrappedHandler);
}

/**
 * For this to work a handler needs to be defined for the channel in the Main Bridge.
 * @param channel
 * @returns
 */
async function invoke<BCh extends keyof BridgeChannel>(
    channel: BCh,
    args?: any,
): Promise<BridgeChannel[BCh]> {
    const data = await ipcRenderer.invoke(channel, args);
    return data as BridgeChannel[BCh];
}

/**
 * Due to limitations on the exposable API a simple object literal has to be used
 * to pass the functionality to the renderer process
 * https://www.electronjs.org/docs/api/context-bridge#api
 */
const rendererBridge = {
    onMessage,
    invoke,
};

// Declare the type Bridge's exposed version type for the renderer process
declare global {
    interface Window {
        bridge: typeof rendererBridge;
    }
}

contextBridge.exposeInMainWorld('bridge', rendererBridge);
