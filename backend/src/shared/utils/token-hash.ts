import { createHash } from 'node:crypto';

/**
 * Huella de un refresh token para guardarla en la base de datos.
 *
 * La tabla `refresh_tokens` almacena esta huella, nunca el JWT emitido: un
 * volcado de la tabla (respaldo mal guardado, acceso de solo lectura, una
 * captura de Prisma Studio) entregaría si no sesiones vivas de siete días de
 * todos los usuarios a la vez.
 *
 * SHA-256 sin sal y sin estiramiento es lo correcto AQUÍ, al contrario que con
 * las contraseñas: el material de entrada es un JWT de alta entropía generado
 * por el servidor, no una frase elegida por una persona, así que no hay
 * diccionario que precomputar. Y el hash debe ser determinista para poder
 * buscar por él con un índice único, que es justo lo que bcrypt impide.
 */
export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
