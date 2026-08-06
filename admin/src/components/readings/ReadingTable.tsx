import { Link } from 'react-router-dom';
import { Pencil, ListChecks, Eye } from 'lucide-react';
import { ReadingListItem } from '../../types/api';
import styles from './ReadingTable.module.css';
import { usePublishReading, useArchiveReading } from '../../hooks/useReadings';
import { COMPREHENSION_LEVEL_LABEL, READING_STATUS_LABEL } from '../../utils/labels';
import { mutateWithToast } from '../../utils/mutationToast';

const STATUS_BADGE_CLASS: Record<ReadingListItem['status'], string> = {
  DRAFT: styles.badgeDraft as string,
  PUBLISHED: styles.badgePublished as string,
  ARCHIVED: styles.badgeArchived as string,
};

interface ReadingTableProps {
  readings: ReadingListItem[];
  isLoading: boolean;
  onEdit: (readingId: string) => void;
}

export function ReadingTable({ readings, isLoading, onEdit }: ReadingTableProps) {
  const publish = usePublishReading();
  const archive = useArchiveReading();

  const handlePublish = (id: string) => {
    mutateWithToast(publish.mutate, id, {
      successMessage: 'Lectura publicada',
      errorFallback: 'No se pudo publicar la lectura',
    });
  };

  const handleArchive = (id: string) => {
    mutateWithToast(archive.mutate, id, {
      successMessage: 'Lectura archivada',
      errorFallback: 'No se pudo archivar la lectura',
    });
  };

  if (!isLoading && readings.length === 0) {
    return <div className={styles.emptyState}>No hay lecturas todavía. Crea la primera.</div>;
  }

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>Título</th>
          <th>Nivel</th>
          <th>Preguntas</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {readings.map((reading) => (
          <tr key={reading.id}>
            <td>{reading.title}</td>
            <td>{COMPREHENSION_LEVEL_LABEL[reading.comprehensionLevel]}</td>
            <td>{reading.questionsCount}</td>
            <td>
              <span className={`${styles.badge} ${STATUS_BADGE_CLASS[reading.status]}`}>
                {READING_STATUS_LABEL[reading.status]}
              </span>
            </td>
            <td>
              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.actionButton}
                  onClick={() => onEdit(reading.id)}
                >
                  <Pencil size={14} />
                  Editar
                </button>

                <Link to={`/readings/${reading.id}/questions`} className={styles.actionButton}>
                  <ListChecks size={14} />
                  Preguntas ({reading.questionsCount})
                </Link>

                <Link to={`/readings/${reading.id}/preview`} className={styles.actionButton}>
                  <Eye size={14} />
                  Vista previa
                </Link>

                {reading.status === 'DRAFT' && (
                  <button
                    type="button"
                    className={styles.actionButton}
                    disabled={publish.isPending}
                    onClick={() => handlePublish(reading.id)}
                  >
                    Publicar
                  </button>
                )}
                {reading.status !== 'ARCHIVED' && (
                  <button
                    type="button"
                    className={styles.actionButton}
                    disabled={archive.isPending}
                    onClick={() => handleArchive(reading.id)}
                  >
                    Archivar
                  </button>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
