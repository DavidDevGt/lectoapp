-- Guardar solo el SHA-256 del refresh token, nunca el JWT emitido.
--
-- Las filas existentes se BORRAN en lugar de convertirse. Se podría calcular el
-- hash en SQL con pgcrypto, pero eso conservaría sesiones cuyo token ya estuvo
-- guardado en claro y pudo filtrarse en un respaldo. Vaciar la tabla las
-- invalida todas: el coste es que cada usuario vuelve a iniciar sesión una vez.
DELETE FROM "refresh_tokens";

DROP INDEX IF EXISTS "refresh_tokens_token_idx";
DROP INDEX IF EXISTS "refresh_tokens_token_key";

ALTER TABLE "refresh_tokens" RENAME COLUMN "token" TO "tokenHash";

CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");
CREATE INDEX "refresh_tokens_tokenHash_idx" ON "refresh_tokens"("tokenHash");
