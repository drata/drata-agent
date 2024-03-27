export type AgentDeviceIdentifiers = {
    hwSerial: {
        hardware_serial: string | undefined;
        board_serial: string | undefined;
    };
    macAddress: { mac: string | undefined };
};
