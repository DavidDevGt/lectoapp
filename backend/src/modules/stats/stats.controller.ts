import { Request, Response, NextFunction } from 'express';
import { StatsService } from './stats.service';
import { ApiResponse } from '../../shared/types/api-response';
import { AuthenticationError } from '../../shared/errors';
import { DashboardQuery } from './stats.validator';

export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  dashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AuthenticationError();
      const query = req.query as unknown as DashboardQuery;
      const data = await this.statsService.getDashboard(query);
      const response: ApiResponse<typeof data> = { success: true, data, error: null };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };
}
