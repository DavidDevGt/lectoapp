import { Request, Response, NextFunction } from 'express';
import { UserService } from './user.service';
import { ApiResponse } from '../../shared/types/api-response';
import { AuthenticationError } from '../../shared/errors';
import { toPaginationMeta } from '../../shared/types/pagination';
import { UserQuery } from './user.validator';

export class UserController {
  constructor(private readonly userService: UserService) {}

  me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AuthenticationError();
      const user = await this.userService.findById(req.user.id);
      const response: ApiResponse<typeof user> = { success: true, data: user, error: null };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  updateMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AuthenticationError();
      const user = await this.userService.updateMe(req.user.id, req.body);
      const response: ApiResponse<typeof user> = { success: true, data: user, error: null };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = req.query as unknown as UserQuery;
      const result = await this.userService.findAll(query);
      res.json({
        success: true,
        data: result.items,
        error: null,
        meta: toPaginationMeta(result.page, result.limit, result.total),
      });
    } catch (error) {
      next(error);
    }
  };
}
