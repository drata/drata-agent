import { isNil } from 'lodash';
import { TARGET_ENV } from '../../constants/environment';
import { Region } from '../../enums/region.enum';
import { TargetEnv } from '../../enums/target-env.enum';

const ApiHostUrl: Record<TargetEnv, Record<Region, string>> = {
    [TargetEnv.LOCAL]: {
        [Region.NA]: 'http://localhost:3000',
        [Region.EU]: 'http://localhost:3001',
    },
    [TargetEnv.PROD]: {
        [Region.NA]: 'https://agent.drata.com',
        [Region.EU]: 'https://agent.eu.drata.com',
    },
    [TargetEnv.DEV]: {
        [Region.NA]: 'https://agent.dev.drata.com',
        [Region.EU]: 'https://agent.dev.drata.com',
    },
    [TargetEnv.QA]: {
        [Region.NA]: 'https://agent.qa.drata.com',
        [Region.EU]: 'https://agent.qa.drata.com',
    },
};

const targetEnv = TargetEnv[process.env.TARGET_ENV as TargetEnv];

if (isNil(targetEnv)) {
    throw new RangeError(
        `Illegal value provided for targetEnv "${targetEnv}". Value has to be on enum TargetEnv.`,
    );
}

export function getDataFileName(): string {
    if (TARGET_ENV.PROD) {
        return 'app-data';
    }
    return `${targetEnv.toLowerCase()}-app-data`;
}

/**
 *
 * @param region: if region is undefined then set the default region
 * @returns the base url depends of the region
 */
export function resolveBaseUrl(region: Region): string {
    if (!ApiHostUrl[targetEnv]?.[region]) {
        throw new Error(
            `Unable to resolve region ${region} for environment ${targetEnv}.`,
        );
    }

    return ApiHostUrl[targetEnv][region];
}
