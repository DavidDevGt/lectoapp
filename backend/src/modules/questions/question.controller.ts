import { Request, Response, NextFunction } from 'express';
import { QuestionService } from './question.service';
import { ApiResponse } from '../../shared/types/api-response';
import { AuthenticationError } from '../../shared/errors';
import { QuestionQuery } from './question.validator';

export class QuestionController {
  constructor(private readonly questionService: QuestionService) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AuthenticationError();
      const questions = await this.questionService.findAllByReading(
        req.params.readingId as string,
        req.user.role,
        req.query as unknown as QuestionQuery,
      );
      const response: ApiResponse<typeof questions> = { success: true, data: questions, error: null };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const question = await this.questionService.create(req.params.readingId as string, req.body);
      const response: ApiResponse<typeof question> = { success: true, data: question, error: null };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const question = await this.questionService.update(
        req.params.readingId as string,
        req.params.id as string,
        req.body,
      );
      const response: ApiResponse<typeof question> = { success: true, data: question, error: null };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.questionService.delete(req.params.readingId as string, req.params.id as string);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  approve = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const question = await this.questionService.approve(
        req.params.readingId as string,
        req.params.id as string,
      );
      const response: ApiResponse<typeof question> = { success: true, data: question, error: null };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}
