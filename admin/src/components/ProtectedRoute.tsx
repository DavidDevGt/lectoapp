import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { RouteFallback } from './RouteFallback';

/**
 * La sesión ya no está disponible de forma sincrónica: al cargar la página hay
 * que preguntarle al servidor si la cookie de refresh sigue viva. Durante ese
 * viaje el estado es 'loading' y hay que ESPERAR, no redirigir — si no, quien
 * tiene sesión válida rebota al login en cada recarga.
 */
export function ProtectedRoute() {
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);

  if (status === 'loading') {
    return <RouteFallback />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export function AdminOnlyRoute() {
  const user = useAuthStore((s) => s.user);
  const status = useAuthStore((s) => s.status);

  if (status === 'loading') {
    return <RouteFallback />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'ADMIN') {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
