import { AuthModes } from '../enums/auth-modes.enum';

export interface AuthResponse {
    accessToken: string;
    mode: AuthModes;
}
