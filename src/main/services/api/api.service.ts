import { isNil } from 'lodash';
import { AgentV2Response } from '../../../entities/agent-v2-response.interface';
import { AuthResponse } from '../../../entities/auth-response.interface';
import { AxiosHelper } from '../../../main/helpers/axios.helper';
import { ServiceBase } from '../service-base.service';
import { QueryResult } from '../system-query/entities/query-result.type';
import { AgentInitializationDataResponseDto } from './dtos/agent-initialization-data-response.dto';
import { AgentV2ResponseDto } from './dtos/agent-v2-response.dto';
import { MeResponseDto } from './dtos/me-response.dto';
import { AgentDeviceIdentifiers } from './types/agent-device-identifiers.type';

export class ApiService extends ServiceBase {
    async register(agentDeviceIdentifiers: AgentDeviceIdentifiers) {
        const { data } = await this.registerWorkstation(agentDeviceIdentifiers);

        if (isNil(data)) {
            throw new Error('Missing data on register request.');
        }

        const { lastCheckedAt } = data;

        this.dataStore.set('lastCheckedAt', lastCheckedAt);
    }

    async loginWithMagicLink(token: string): Promise<MeResponseDto> {
        const { data } = await this.authMagicLink(token);

        if (isNil(data)) {
            throw new Error('Missing data from auth request.');
        }

        if (!isNil(data.accessToken)) {
            this.dataStore.set('accessToken', data.accessToken);
        } else {
            this.dataStore.remove('accessToken');
            this.dataStore.remove('user');
        }

        // once the accessToken is set we can start making authorized requests
        const { data: user } = await this.getMe();

        if (isNil(user)) {
            this.dataStore.clearData();
            this.dataStore.remove('accessToken');
            this.dataStore.remove('user');
            throw new Error('Missing data from get user info request.');
        }

        // Filter user data to only include fields we want
        const filteredUser: MeResponseDto = {
            id: user.id,
            entryId: user.entryId,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            jobTitle: user.jobTitle,
            avatarUrl: user.avatarUrl,
            roles: user.roles,
            drataTermsAgreedAt: user.drataTermsAgreedAt,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            signature: user.signature,
            language: user.language,
        };

        this.dataStore.set('user', filteredUser);

        return filteredUser;
    }

    async sync(results: QueryResult): Promise<AgentV2ResponseDto> {
        const { data } = await this.setPersonnelChecks(results);

        if (isNil(data)) {
            throw new Error('Missing data on set personnel checks request.');
        }

        this.dataStore.multiSet({
            complianceData: data,
            lastCheckedAt: data.data.lastcheckedAt,
            winAvServicesMatchList: data.winAvServicesMatchList,
        });

        return data;
    }

    async initialData(): Promise<AgentInitializationDataResponseDto> {
        const { data } = await this.getInitData();

        if (isNil(data)) {
            throw new Error('Missing data on get initialization data request.');
        }

        /**
         * Note: when some data gets added to the store on this method
         * the getter DataStoreHelper.isInitDataReady has to be updated
         */

        this.dataStore.multiSet({
            winAvServicesMatchList: data.winAvServicesMatchList,
        });

        return data;
    }

    private authMagicLink(token: string) {
        return AxiosHelper.instance.post<AuthResponse>(
            `/auth/magic-link/${token}`,
        );
    }

    private registerWorkstation(
        agentDeviceIdentifiers: AgentDeviceIdentifiers,
    ) {
        return AxiosHelper.instance.post<AgentV2Response>(
            '/agentv2/register',
            agentDeviceIdentifiers,
        );
    }

    private setPersonnelChecks(data: QueryResult) {
        return AxiosHelper.instance.post<AgentV2ResponseDto>(
            '/agentv2/sync',
            data,
        );
    }

    private getMe() {
        return AxiosHelper.instance.get<MeResponseDto>('/users/me');
    }

    private getInitData() {
        return AxiosHelper.instance.get<AgentInitializationDataResponseDto>(
            '/agentv2/init',
        );
    }
}
