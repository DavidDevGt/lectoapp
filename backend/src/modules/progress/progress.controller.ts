import { Request, Response, NextFunction } from 'express';
import { ProgressService } from './progress.service';
import { ApiResponse } from '../../shared/types/api-response';
import { AuthenticationError } from '../../shared/errors';

export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  submit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AuthenticationError();
      const result = await this.progressService.submit(req.user.id, req.body);
      const response: ApiResponse<typeof result> = { success: true, data: result, error: null };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AuthenticationError();
      const result = await this.progressService.getOverallProgress(req.user.id);
      const response: ApiResponse<typeof result> = { success: true, data: result, error: null };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  byReading = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AuthenticationError();
      const result = await this.progressService.getReadingProgress(
        req.user.id,
        req.params.readingId as string,
      );
      const response: ApiResponse<typeof result> = { success: true, data: result, error: null };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}
