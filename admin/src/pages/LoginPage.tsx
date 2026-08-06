import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Navigate, useNavigate } from 'react-router-dom';
import styles from './LoginPage.module.css';
import { useLogin } from '../hooks/useAuth';
import { useAuthStore } from '../stores/authStore';
import { ApiError } from '../services/api-client';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const login = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  if (user) {
    return <Navigate to="/" replace />;
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      const result = await login.mutateAsync(values);
      if (result.user.role !== 'ADMIN') {
        login.reset();
        return;
      }
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
            <label className={styles.label} htmlFor="email">
              Email
            </label>
            <input id="email" type="email" className={styles.input} {...register('email')} />
            {errors.email && <span className={styles.errorText}>{errors.email.message}</span>}
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">
              Contraseña
            </label>
            <input id="password" type="password" className={styles.input} {...register('password')} />
            {errors.password && <span className={styles.errorText}>{errors.password.message}</span>}
          </div>

          <button type="submit" className={styles.submitButton} disabled={login.isPending}>
            {login.isPending ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
