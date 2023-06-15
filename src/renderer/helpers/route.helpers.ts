import { forEach, isEmpty } from 'lodash';
import { AppRoute } from '../../renderer/components/app-route.enum';

const reverse = (route: AppRoute, params: Record<string, string>): string => {
    let newRoute = route.toString();

    const keys = Object.keys(params);

    if (!isEmpty(keys)) {
        forEach(keys, key => {
            newRoute = newRoute.replace(
                new RegExp(`:${key}?|:${key}`),
                window.encodeURIComponent(params[key]),
            );
        });
    }

    return newRoute;
};

export { reverse };
