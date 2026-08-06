import { Request, Response, NextFunction } from 'express';
import { MediaService } from './media.service';
import { ApiResponse } from '../../shared/types/api-response';
import { AuthenticationError } from '../../shared/errors';
import { UploadMediaInput } from './media.validator';

export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  upload = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new AuthenticationError();
      const { type } = req.body as UploadMediaInput;
      const result = await this.mediaService.upload(req.file, type, req.user.role);
      const response: ApiResponse<typeof result> = { success: true, data: result, error: null };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };
}
