import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Navigate, useNavigate } from 'react-router-dom';
import styles from './LoginPage.module.css';
import { useLogin } from '../hooks/useAuth';
import { useAuthStore } from '../stores/authStore';
import { ApiError } from '../services/api-client';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { RouteFallback } from '../components/RouteFallback';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);
  const navigate = useNavigate();
  const login = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  // Mientras se comprueba la cookie de refresh no se sabe todavía si hay
  // sesión. Pintar el formulario aquí haría parpadear el login a alguien que ya
  // está autenticado.
  if (status === 'loading') {
    return <RouteFallback />;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      await login.mutateAsync(values);
      navigate('/', { replace: true });
    } catch {
      // el error se muestra abajo vía login.error
    }
  });

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.brand}>LectoApp</div>
        <div className={styles.subtitle}>Panel de administración</div>

        {login.isError && (
          <div className={styles.formError}>
            {login.error instanceof ApiError ? login.error.message : 'No se pudo iniciar sesión'}
          </div>
        )}

        <form onSubmit={onSubmit} noValidate>
          <div className={styles.field}>
            <Input
              id="email"
              type="email"
              label="Email"
              error={errors.email?.message}
              {...register('email')}
            />
          </div>

          <div className={styles.field}>
            <Input
              id="password"
              type="password"
              label="Contraseña"
              error={errors.password?.message}
              {...register('password')}
            />
          </div>

          <div style={{ marginTop: 'var(--space-4)' }}>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              style={{ width: '100%' }}
              isLoading={login.isPending}
            >
              {login.isPending ? 'Ingresando…' : 'Ingresar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
