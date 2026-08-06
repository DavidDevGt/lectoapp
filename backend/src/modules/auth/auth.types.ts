import { ProgressionLevel, UserRole } from '../../generated/prisma';

export interface AuthUserDTO {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  currentLevel: ProgressionLevel;
  totalPoints: number;
  streak: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: AuthUserDTO;
  accessToken: string;
  refreshToken: string;
}
