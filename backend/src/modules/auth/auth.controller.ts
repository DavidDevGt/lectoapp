import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { ApiResponse } from '../../shared/types/api-response';
import { AuthResult, AuthTokens, AuthUserDTO } from './auth.types';
import { AuthenticationError } from '../../shared/errors';
import {
  clearRefreshCookie,
  readRefreshToken,
  setRefreshCookie,
  usesCookieTransport,
} from './auth.cookie';

/**
 * En modo cookie el refresh token NO viaja en el cuerpo: si lo hiciera, el
 * JavaScript de la SPA podría leerlo y la cookie HttpOnly no serviría de nada.
 * Por eso `refreshToken` es opcional en las dos respuestas.
 */
interface AuthResponseBody {
  user: AuthUserDTO;
  accessToken: string;
  refreshToken?: string;
}

interface TokensResponseBody {
  accessToken: string;
  refreshToken?: string;
}

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Entrega el refresh token por el transporte que pida el cliente: cookie
   * HttpOnly para el navegador, cuerpo de la respuesta para la app móvil.
   *
   * Devuelve el token solo cuando NO se usó cookie, para que quien llama lo
   * incluya en el cuerpo.
   */
  private deliverRefreshToken(req: Request, res: Response, refreshToken: string): string | undefined {
    if (usesCookieTransport(req)) {
      setRefreshCookie(res, refreshToken);
      return undefined;
    }
    return refreshToken;
  }

  private toAuthBody(req: Request, res: Response, result: AuthResult): AuthResponseBody {
    return {
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: this.deliverRefreshToken(req, res, result.refreshToken),
    };
  }

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.register(req.body);
      const response: ApiResponse<AuthResponseBody> = {
        success: true,
        data: this.toAuthBody(req, res, result),
        error: null,
      };
      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authService.login(req.body);
      const response: ApiResponse<AuthResponseBody> = {
        success: true,
        data: this.toAuthBody(req, res, result),
        error: null,
      };
      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as { refreshToken?: string } | undefined;
      const refreshToken = readRefreshToken(req, body?.refreshToken);

      if (!refreshToken) {
        throw new AuthenticationError('Refresh token ausente');
      }

      const tokens: AuthTokens = await this.authService.refresh(refreshToken);

      // La rotación se entrega por el mismo canal por el que llegó. En modo
      // cookie el servidor sobrescribe la cookie con el token nuevo, así que el
      // cliente no puede quedarse con el viejo aunque quiera: era justo ese
      // descuido el que disparaba falsas alarmas de reutilización.
      const response: ApiResponse<TokensResponseBody> = {
        success: true,
        data: {
          accessToken: tokens.accessToken,
          refreshToken: this.deliverRefreshToken(req, res, tokens.refreshToken),
        },
        error: null,
      };
      res.status(200).json(response);
    } catch (error) {
      // Un refresh token muerto deja la cookie inservible: borrarla evita que el
      // navegador siga reintentando con ella en cada carga de la página.
      if (usesCookieTransport(req)) {
        clearRefreshCookie(res);
      }
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError();
      }
      await this.authService.logout(req.user.id);
      clearRefreshCookie(res);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}
