export interface UserProfileDTO {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl: string | null;
  gradeLevel: string | null;
  currentLevel: string;
  totalPoints: number;
  streak: number;
  createdAt: Date;
}
