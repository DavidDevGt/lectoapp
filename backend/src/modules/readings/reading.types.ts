export interface ReadingListItemDTO {
  id: string;
  title: string;
  comprehensionLevel: string;
  progressionLevel: string;
  status: string;
  coverImageUrl: string | null;
  estimatedTimeMin: number | null;
  questionsCount: number;
  createdAt: Date;
}

export interface QuestionOptionDTO {
  id: string;
  text: string;
}

export interface ReadingQuestionDTO {
  id: string;
  statement: string;
  type: string;
  options: QuestionOptionDTO[];
  order: number;
  // Solo presentes para ADMIN (ver reading.service.ts#toDetailDTO)
  correctAnswer?: string;
  explanation?: string | null;
  isAiGenerated?: boolean;
  status?: string;
}

export interface ReadingDetailDTO {
  id: string;
  title: string;
  content: string;
  comprehensionLevel: string;
  progressionLevel: string;
  status: string;
  coverImageUrl: string | null;
  estimatedTimeMin: number | null;
  order: number;
  questions: ReadingQuestionDTO[];
  author: { id: string; name: string };
  createdAt: Date;
  updatedAt: Date;
}
