import { useState } from 'react';
import { Plus } from 'lucide-react';
import styles from './ReadingsPage.module.css';
import { useReadings } from '../hooks/useReadings';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { ReadingTable } from '../components/readings/ReadingTable';
import { ReadingFormModal } from '../components/readings/ReadingFormModal';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';

type ModalState = { mode: 'create' } | { mode: 'edit'; readingId: string } | null;

export function ReadingsPage() {
  const [modalState, setModalState] = useState<ModalState>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('ALL');
  const [comprehensionLevel, setComprehensionLevel] = useState<string>('ALL');

  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  const { data, isLoading, isError } = useReadings({
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    status: status !== 'ALL' ? status : undefined,
    comprehensionLevel: comprehensionLevel !== 'ALL' ? comprehensionLevel : undefined,
  });

  const totalPages = data?.meta?.totalPages ?? 1;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatus(e.target.value);
    setPage(1);
  };

  const handleLevelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setComprehensionLevel(e.target.value);
    setPage(1);
  };

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Lecturas</h1>
        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus size={18} aria-hidden="true" />}
          onClick={() => setModalState({ mode: 'create' })}
        >
          Nueva lectura
        </Button>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchInput}>
          <Input
            type="text"
            placeholder="Buscar por título..."
            value={search}
            onChange={handleSearchChange}
          />
        </div>

        <div className={styles.filterSelect}>
          <Select value={status} onChange={handleStatusChange}>
            <option value="ALL">Todos los estados</option>
            <option value="DRAFT">Borrador</option>
            <option value="PUBLISHED">Publicada</option>
            <option value="ARCHIVED">Archivada</option>
          </Select>
        </div>

        <div className={styles.filterSelect}>
          <Select value={comprehensionLevel} onChange={handleLevelChange}>
            <option value="ALL">Todos los niveles</option>
            <option value="LITERAL">Literal</option>
            <option value="INFERENTIAL">Inferencial</option>
            <option value="CRITICAL">Crítico</option>
          </Select>
        </div>
      </div>

      {isError && <p className={styles.errorState}>No se pudieron cargar las lecturas.</p>}

      <ReadingTable
        readings={data?.items ?? []}
        isLoading={isLoading}
        onEdit={(readingId) => setModalState({ mode: 'edit', readingId })}
      />

      {data?.meta && totalPages > 1 && (
        <div className={styles.pagination}>
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
          >
            Anterior
          </Button>

          <span className={styles.pageInfo}>
            Página {page} de {totalPages} ({data.meta.total} lecturas)
          </span>

          <Button
            variant="secondary"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
          >
            Siguiente
          </Button>
        </div>
      )}

      {modalState?.mode === 'create' && (
        <ReadingFormModal mode="create" onClose={() => setModalState(null)} />
      )}

      {modalState?.mode === 'edit' && (
        <ReadingFormModal mode="edit" readingId={modalState.readingId} onClose={() => setModalState(null)} />
      )}
    </div>
  );
}
