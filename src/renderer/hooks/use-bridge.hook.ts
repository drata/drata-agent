import { useMemo } from 'react';

/**
 * Simple React hook to use the Bridge without accessing window everywhere.
 * Also, this hook makes sure that the components that use it know that the bridge instance doesn't change.
 */
export function useBridge() {
    return useMemo(() => window.bridge, []);
}
