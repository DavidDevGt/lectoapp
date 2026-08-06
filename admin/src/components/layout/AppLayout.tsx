import { NavLink, Outlet } from 'react-router-dom';
import { BookOpen, LayoutDashboard } from 'lucide-react';
import styles from './AppLayout.module.css';
import { useAuthStore } from '../../stores/authStore';
import { useLogout } from '../../hooks/useAuth';

export function AppLayout() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  const linkClassName = ({ isActive }: { isActive: boolean }) =>
    isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink;

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>LectoApp Admin</div>
        <nav className={styles.nav}>
          <NavLink to="/" end className={linkClassName}>
            <LayoutDashboard size={16} style={{ marginRight: 8, verticalAlign: 'text-bottom' }} />
            Dashboard
          </NavLink>
          <NavLink to="/readings" className={linkClassName}>
            <BookOpen size={16} style={{ marginRight: 8, verticalAlign: 'text-bottom' }} />
            Lecturas
          </NavLink>
        </nav>
      </aside>

      <div className={styles.main}>
        <header className={styles.header}>
          <div className={styles.userInfo}>
            <span>{user?.name}</span>
          </div>
          <button className={styles.logoutButton} onClick={() => logout.mutate()}>
            Cerrar sesión
          </button>
        </header>

        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
