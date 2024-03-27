export interface ComplianceCheckResponseDto {
    id: number;
    compliant: boolean;
    status: string;
    type: string;
    expiresAt: string;
    checkFrequency: string;
    lastCheckedAt: string;
    createdAt: string;
    updatedAt: string;
}
