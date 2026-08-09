import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { BookOpen, LayoutDashboard, Menu, X } from 'lucide-react';
import styles from './AppLayout.module.css';
import { useAuthStore } from '../../stores/authStore';
import { useLogout } from '../../hooks/useAuth';
import { Button } from '../ui/Button';

export function AppLayout() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Cerrar menú al cambiar de ruta en móvil
  const handleNavClick = () => {
    setMobileOpen(false);
  };

  const linkClassName = ({ isActive }: { isActive: boolean }) =>
    isActive ? `${styles.navLink} ${styles.navLinkActive}` : styles.navLink;

  return (
    <div className={styles.shell}>
      {/* Barra superior visible solo en móviles */}
      <div className={styles.mobileBar}>
        <div className={styles.brand}>LectoApp Admin</div>
        <button
          type="button"
          className={styles.menuToggleButton}
          aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
          onClick={() => setMobileOpen((prev) => !prev)}
        >
          {mobileOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
        </button>
      </div>

      {/* Backdrop para cerrar en móvil */}
      {mobileOpen && (
        <div
          className={styles.backdrop}
          onClick={() => setMobileOpen(false)}
          data-testid="mobile-backdrop"
        />
      )}

      {/* Sidebar fijo en escritorio / Drawer en móvil */}
      <aside
        className={`${styles.sidebar} ${mobileOpen ? styles.sidebarMobileOpen : ''}`}
        aria-label="Navegación principal"
      >
        <div className={styles.brand}>LectoApp Admin</div>
        <nav className={styles.nav}>
          <NavLink to="/" end className={linkClassName} onClick={handleNavClick}>
            <LayoutDashboard size={18} aria-hidden="true" />
            Dashboard
          </NavLink>
          <NavLink to="/readings" className={linkClassName} onClick={handleNavClick}>
            <BookOpen size={18} aria-hidden="true" />
            Lecturas
          </NavLink>
        </nav>
      </aside>

      <div className={styles.main}>
        <header className={styles.header}>
          <div className={styles.userInfo}>
            <span>{user?.name}</span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            isLoading={logout.isPending}
            onClick={() => logout.mutate()}
          >
            Cerrar sesión
          </Button>
        </header>

        <main className={styles.content} key={location.pathname}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
