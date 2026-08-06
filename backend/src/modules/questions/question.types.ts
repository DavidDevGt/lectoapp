export interface QuestionDTO {
  id: string;
  statement: string;
  type: string;
  options: { id: string; text: string }[];
  order: number;
  isAiGenerated: boolean;
  // Solo visibles para ADMIN
  correctAnswer?: string;
  explanation?: string | null;
  status?: string;
}
