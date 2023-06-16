import { DataStoreHelper } from '../../main/helpers/data-store.helper';
import { Logger } from '../../main/helpers/logger.helpers';

export class ServiceBase {
    protected readonly logger = new Logger(this.constructor.name);
    protected readonly dataStore = DataStoreHelper.instance;
}
