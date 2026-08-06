import { useNavigate, useParams } from 'react-router-dom';
import styles from './ReadingPreviewPage.module.css';
import { useReading } from '../hooks/useReadings';
import { ReadingStatus } from '../types/api';
import { COMPREHENSION_LEVEL_LABEL, PROGRESSION_LEVEL_LABEL } from '../utils/labels';

const STATUS_PREVIEW_LABEL: Record<ReadingStatus, string> = {
  DRAFT: 'Borrador — no visible para estudiantes',
  PUBLISHED: 'Publicada',
  ARCHIVED: 'Archivada — no visible para estudiantes',
};

export function ReadingPreviewPage() {
  const { readingId = '' } = useParams<{ readingId: string }>();
  const navigate = useNavigate();
  const { data: reading, isLoading, isError } = useReading(readingId);

  return (
    <div className={styles.page}>
      <button type="button" className={styles.backLink} onClick={() => navigate(-1)}>
        ← Volver
      </button>

      {isLoading && <div className={styles.loadingState}>Cargando lectura…</div>}

      {isError && <div className={styles.errorState}>No se pudo cargar la lectura</div>}

      {!isLoading && !isError && reading && (
        <>
          {reading.status !== 'PUBLISHED' && (
            <div className={styles.statusBadge}>{STATUS_PREVIEW_LABEL[reading.status]}</div>
          )}

          <div className={styles.mobileFrame} data-testid="mobile-frame">
            {reading.coverImageUrl ? (
              <img className={styles.cover} src={reading.coverImageUrl} alt="Portada de la lectura" />
            ) : (
              <div className={styles.coverPlaceholder} data-testid="cover-placeholder">
                Sin portada
              </div>
            )}

            <div className={styles.body}>
              <h1 className={styles.title}>{reading.title}</h1>

              <div className={styles.meta}>
                <span className={styles.metaItem}>{COMPREHENSION_LEVEL_LABEL[reading.comprehensionLevel]}</span>
                <span className={styles.metaItem}>{PROGRESSION_LEVEL_LABEL[reading.progressionLevel]}</span>
                {reading.estimatedTimeMin !== null && (
                  <span className={styles.metaItem}>⏱ {reading.estimatedTimeMin} min</span>
                )}
              </div>

              <div className={styles.content}>
                {reading.content.split(/\n\s*\n/).map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
