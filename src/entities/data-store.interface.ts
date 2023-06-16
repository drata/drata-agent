import { Region } from '../enums/region.enum';
import { SyncState } from '../enums/sync-state.enum';
import { AgentV2ResponseDto } from '../main/services/api/dtos/agent-v2-response.dto';
import { MeResponseDto } from '../main/services/api/dtos/me-response.dto';
import { DebugInfo } from '../types/debug-info.type';
import { ProtocolArgs } from '../types/protocol-args.type';

export interface DataStore {
    appVersion?: string;
    accessToken?: string;
    user?: MeResponseDto;
    syncState?: SyncState;
    lastCheckedAt?: string;
    complianceData?: AgentV2ResponseDto;
    winAvServicesMatchList?: string[];
    capturedProtocol?: ProtocolArgs;
    debugInfo?: DebugInfo;
    region?: Region;
}
