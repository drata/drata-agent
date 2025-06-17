export interface MeResponseDto {
    id: number;
    entryId: string;
    email: string;
    firstName: string;
    lastName: string;
    jobTitle?: string;
    avatarUrl: string;
    roles: string[];
    drataTermsAgreedAt: string;
    createdAt: string;
    updatedAt: string;
    signature: string;
    language: string;
}
