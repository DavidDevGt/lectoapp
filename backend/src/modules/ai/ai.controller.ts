import { Request, Response, NextFunction } from 'express';
import { AiService } from './ai.service';
import { ApiResponse } from '../../shared/types/api-response';
import { GenerateQuestionsInput } from './ai.validator';
import { AuthenticationError } from '../../shared/errors';

export class AiController {
  constructor(private readonly aiService: AiService) {}

  generate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AuthenticationError();
      const input = req.body as GenerateQuestionsInput;
      const questions = await this.aiService.generateQuestionsForReading(input.readingId, input.count);
      const response: ApiResponse<typeof questions> = {
        success: true,
        data: questions,
        error: null,
      };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };
}
