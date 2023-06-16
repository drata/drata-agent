import { sep } from 'path';

export class PathHelper {
    /**
     * Resolve the spaces on paths that may cause problems
     * @param path valid path
     * @returns path with any section containing spaces whapped on ""
     */
    static safeSpaces(path: string): string {
        const steps = path.split(sep);

        return steps
            .map(step => {
                if (step.includes(' ')) {
                    return `"${step}"`;
                }
                return step;
            })
            .join(sep);
    }
}
