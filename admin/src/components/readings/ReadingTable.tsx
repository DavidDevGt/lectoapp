import { Link } from 'react-router-dom';
import { Pencil, ListChecks, Eye, Send, Archive, RotateCcw } from 'lucide-react';
import { ReadingListItem } from '../../types/api';
import styles from './ReadingTable.module.css';
import { usePublishReading, useArchiveReading, useUnarchiveReading } from '../../hooks/useReadings';
import { COMPREHENSION_LEVEL_LABEL, READING_STATUS_LABEL } from '../../utils/labels';
import { mutateWithToast } from '../../utils/mutationToast';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

const STATUS_BADGE_VARIANT: Record<ReadingListItem['status'], 'draft' | 'published' | 'archived'> = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
};

interface ReadingTableProps {
  readings: ReadingListItem[];
  isLoading: boolean;
  onEdit: (readingId: string) => void;
}

export function ReadingTable({ readings, isLoading, onEdit }: ReadingTableProps) {
  const publish = usePublishReading();
  const archive = useArchiveReading();
  const unarchive = useUnarchiveReading();

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

  const handleUnarchive = (id: string) => {
    mutateWithToast(unarchive.mutate, id, {
      successMessage: 'Lectura desarchivada',
      errorFallback: 'No se pudo desarchivar la lectura',
    });
  };

  if (!isLoading && readings.length === 0) {
    return <div className={styles.emptyState}>No hay lecturas todavía. Crea la primera.</div>;
  }

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Título</th>
            <th>Nivel</th>
            <th style={{ textAlign: 'center' }}>Preguntas</th>
            <th>Estado</th>
            <th style={{ textAlign: 'right' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {readings.map((reading) => (
            <tr key={reading.id}>
              <td className={styles.titleCell}>{reading.title}</td>
              <td>{COMPREHENSION_LEVEL_LABEL[reading.comprehensionLevel]}</td>
              <td className={styles.numericCell}>{reading.questionsCount}</td>
              <td>
                <Badge variant={STATUS_BADGE_VARIANT[reading.status]}>
                  {READING_STATUS_LABEL[reading.status]}
                </Badge>
              </td>
              <td>
                <div className={styles.actions} style={{ justifyContent: 'flex-end' }}>
                  <Button
                    variant="secondary"
                    size="sm"
                    leftIcon={<Pencil size={14} aria-hidden="true" />}
                    onClick={() => onEdit(reading.id)}
                  >
                    Editar
                  </Button>

                  <Button
                    as={Link}
                    to={`/readings/${reading.id}/questions`}
                    variant="ghost"
                    size="sm"
                    leftIcon={<ListChecks size={14} aria-hidden="true" />}
                  >
                    Preguntas ({reading.questionsCount})
                  </Button>

                  <Button
                    as={Link}
                    to={`/readings/${reading.id}/preview`}
                    variant="ghost"
                    size="sm"
                    leftIcon={<Eye size={14} aria-hidden="true" />}
                  >
                    Vista previa
                  </Button>

                  {reading.status === 'DRAFT' && (
                    <Button
                      variant="primary"
                      size="sm"
                      isLoading={publish.isPending}
                      leftIcon={<Send size={14} aria-hidden="true" />}
                      onClick={() => handlePublish(reading.id)}
                    >
                      Publicar
                    </Button>
                  )}

                  {reading.status !== 'ARCHIVED' && (
                    <Button
                      variant="danger"
                      size="sm"
                      isLoading={archive.isPending}
                      leftIcon={<Archive size={14} aria-hidden="true" />}
                      onClick={() => handleArchive(reading.id)}
                    >
                      Archivar
                    </Button>
                  )}

                  {reading.status === 'ARCHIVED' && (
                    <Button
                      variant="secondary"
                      size="sm"
                      isLoading={unarchive.isPending}
                      leftIcon={<RotateCcw size={14} aria-hidden="true" />}
                      onClick={() => handleUnarchive(reading.id)}
                    >
                      Desarchivar
                    </Button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
