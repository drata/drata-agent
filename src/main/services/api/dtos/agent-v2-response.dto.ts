import { ComplianceCheckResponseDto } from './compliance-check-response.dto';
import { PersonnelDataResponseDto } from './personnel-data-response.dto';

export interface AgentV2ResponseDto {
    complianceChecks: ComplianceCheckResponseDto[];
    data: PersonnelDataResponseDto;
    winAvServicesMatchList: string[];
}
