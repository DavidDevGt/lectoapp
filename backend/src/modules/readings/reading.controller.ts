import { Request, Response, NextFunction } from 'express';
import { ReadingService } from './reading.service';
import { ApiResponse } from '../../shared/types/api-response';
import { AuthenticationError } from '../../shared/errors';
import { toPaginationMeta } from '../../shared/types/pagination';
import { ReadingQuery } from './reading.validator';

export class ReadingController {
  constructor(private readonly readingService: ReadingService) {}

  list = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AuthenticationError();
      const query = req.query as unknown as ReadingQuery;
      const result = await this.readingService.findAll(query, req.user.role);
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

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AuthenticationError();
      const reading = await this.readingService.findById(req.params.id as string, req.user.role);
      const response: ApiResponse<typeof reading> = { success: true, data: reading, error: null };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AuthenticationError();
      const reading = await this.readingService.create(req.body, req.user.id);
      const response: ApiResponse<typeof reading> = { success: true, data: reading, error: null };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reading = await this.readingService.update(req.params.id as string, req.body);
      const response: ApiResponse<typeof reading> = { success: true, data: reading, error: null };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  publish = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reading = await this.readingService.publish(req.params.id as string);
      const response: ApiResponse<typeof reading> = { success: true, data: reading, error: null };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  archive = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const reading = await this.readingService.archive(req.params.id as string);
      const response: ApiResponse<typeof reading> = { success: true, data: reading, error: null };
      res.json(response);
    } catch (error) {
      next(error);
    }
  };

  softDelete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.readingService.softDelete(req.params.id as string);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}
