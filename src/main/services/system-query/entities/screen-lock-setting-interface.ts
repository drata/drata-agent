export interface ScreenLockSetting {
    screenLockEnabled?: boolean;
    screenSaverIdleWait?: number;
    lockDelay?: number;
    displayIdleWaitAC?: number;
    displayIdleWaitDC?: number;
    suspendScreenLockAC?: boolean;
    suspendScreenLockDC?: boolean;
    suspendIdleWaitAC?: number;
    suspendIdleWaitDC?: number;
    machineInactivityLimit?: number;
}
