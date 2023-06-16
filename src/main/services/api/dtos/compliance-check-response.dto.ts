export interface ComplianceCheckResponseDto {
    id: number;
    compliant: boolean;
    type: string;
    expiresAt: string;
    checkFrequency: string;
    lastCheckedAt: string;
    createdAt: string;
    updatedAt: string;
}
