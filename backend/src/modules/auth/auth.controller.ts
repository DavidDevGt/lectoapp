import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { ApiResponse } from '../../shared/types/api-response';
import { AuthResult, AuthTokens } from './auth.types';
import { AuthenticationError } from '../../shared/errors';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.register(req.body);
      const response: ApiResponse<AuthResult> = { success: true, data: result, error: null };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.login(req.body);
      const response: ApiResponse<AuthResult> = { success: true, data: result, error: null };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body;
      const result = await this.authService.refresh(refreshToken);
      const response: ApiResponse<AuthTokens> = { success: true, data: result, error: null };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError();
      }
      await this.authService.logout(req.user.id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}
