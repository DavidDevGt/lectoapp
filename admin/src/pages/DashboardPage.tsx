import { BookOpen, CheckCircle2, FileClock, HelpCircle, Trophy, Users } from 'lucide-react';
import styles from './DashboardPage.module.css';
import { useAuthStore } from '../stores/authStore';
import { useDashboardStats } from '../hooks/useDashboardStats';
import { StatCard } from '../components/dashboard/StatCard';
import { ReadingsByStatusChart } from '../components/dashboard/ReadingsByStatusChart';
import { StudentsByLevelChart } from '../components/dashboard/StudentsByLevelChart';
import { TopReadingsChart } from '../components/dashboard/TopReadingsChart';
import { Skeleton } from '../components/ui/Skeleton';
import { Button } from '../components/ui/Button';

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data: stats, isLoading, isError, refetch } = useDashboardStats();
  const hasPendingQuestions = (stats?.questions.byStatus.DRAFT ?? 0) > 0;

  return (
    <div>
      <h1 className={styles.greeting}>Hola, {user?.name}</h1>
      <p className={styles.subtitle}>
        Panel de LectoApp. Usa el menú lateral para gestionar lecturas y preguntas.
      </p>

      {isLoading && (
        <div className={styles.skeletonContainer} data-testid="dashboard-skeleton">
          <div className={styles.skeletonGrid}>
            <Skeleton height={90} borderRadius="8px" />
            <Skeleton height={90} borderRadius="8px" />
            <Skeleton height={90} borderRadius="8px" />
            <Skeleton height={90} borderRadius="8px" />
          </div>
          <Skeleton height={260} borderRadius="8px" />
        </div>
      )}

      {isError && (
        <div className={styles.errorState}>
          <p>No se pudieron cargar las métricas</p>
          <div className={styles.retryButton}>
            <Button variant="secondary" size="md" onClick={() => refetch()}>
              Reintentar
            </Button>
          </div>
        </div>
      )}

      {!isLoading && !isError && stats && (
        <>
          <h2 className={styles.sectionTitle}>Contenido Editorial</h2>
          <div className={styles.statsGrid}>
            <StatCard label="Lecturas totales" value={stats.readings.total} icon={<BookOpen size={18} aria-hidden="true" />} />
            <StatCard
              label="Publicadas"
              value={stats.readings.byStatus.PUBLISHED ?? 0}
              icon={<CheckCircle2 size={18} aria-hidden="true" />}
            />
            <StatCard
              label="Borradores"
              value={stats.readings.byStatus.DRAFT ?? 0}
              icon={<FileClock size={18} aria-hidden="true" />}
            />
          </div>

          <h2 className={styles.sectionTitle}>Banco de Preguntas</h2>
          <div className={styles.statsGrid}>
            <StatCard
              label="Preguntas totales"
              value={stats.questions.total}
              icon={<HelpCircle size={18} aria-hidden="true" />}
            />
            <StatCard
              label="Pendientes de revisión"
              value={stats.questions.byStatus.DRAFT ?? 0}
              hint={hasPendingQuestions ? 'Revisar preguntas pendientes' : undefined}
              to={hasPendingQuestions ? '/readings' : undefined}
            />
          </div>

          <h2 className={styles.sectionTitle}>Estudiantes y Evaluación</h2>
          <div className={styles.statsGrid}>
            <StatCard label="Estudiantes" value={stats.students.total} icon={<Users size={18} aria-hidden="true" />} />
            <StatCard label="Intentos de quiz" value={stats.quizAttempts.total} />
            <StatCard
              label="Tasa de aprobación promedio"
              value={`${stats.quizAttempts.passRatePercentage}%`}
              icon={<Trophy size={18} aria-hidden="true" />}
            />
          </div>

          <h2 className={styles.sectionTitle}>Análisis de Rendimiento</h2>
          <div className={styles.chartsGrid}>
            <ReadingsByStatusChart byStatus={stats.readings.byStatus} />
            <StudentsByLevelChart byProgressionLevel={stats.students.byProgressionLevel} />
            <TopReadingsChart topReadings={stats.topReadings} />
          </div>
        </>
      )}
    </div>
  );
}
