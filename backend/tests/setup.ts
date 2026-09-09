process.env.NODE_ENV ??= 'test';
process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/lectoapp_test?schema=public';

// Los secretos de test cumplen las mismas reglas que exige src/config/env.ts en
// producción (>=32 caracteres, distintos entre sí y con entropía real). Si se
// relajan aquí, los tests dejan de ejercitar la configuración que corre de verdad.
process.env.JWT_ACCESS_SECRET ??= 'test-access-secret-0G7hQ2mZxK9pLvRt4WnB';
process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret-J3sYd8CqAe6TuMk1FvXz';
