import { useState } from 'react';
import styles from './ReadingsPage.module.css';
import { useReadings } from '../hooks/useReadings';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { ReadingTable } from '../components/readings/ReadingTable';
import { ReadingFormModal } from '../components/readings/ReadingFormModal';

type ModalState = { mode: 'create' } | { mode: 'edit'; readingId: string } | null;

export function ReadingsPage() {
  const [modalState, setModalState] = useState<ModalState>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('ALL');
  const [comprehensionLevel, setComprehensionLevel] = useState<string>('ALL');

  // El input se actualiza en cada tecla, pero la consulta espera a que el
  // administrador termine de escribir.
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
        <button className={styles.createButton} onClick={() => setModalState({ mode: 'create' })}>
          Nueva lectura
        </button>
      </div>

      <div className={styles.toolbar}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Buscar por título..."
          value={search}
          onChange={handleSearchChange}
        />

        <select className={styles.filterSelect} value={status} onChange={handleStatusChange}>
          <option value="ALL">Todos los estados</option>
          <option value="DRAFT">Borrador</option>
          <option value="PUBLISHED">Publicada</option>
          <option value="ARCHIVED">Archivada</option>
        </select>

        <select className={styles.filterSelect} value={comprehensionLevel} onChange={handleLevelChange}>
          <option value="ALL">Todos los niveles</option>
          <option value="LITERAL">Literal</option>
          <option value="INFERENTIAL">Inferencial</option>
          <option value="CRITICAL">Crítico</option>
        </select>
      </div>

      {isError && <p className={styles.errorState}>No se pudieron cargar las lecturas.</p>}

      <ReadingTable
        readings={data?.items ?? []}
        isLoading={isLoading}
        onEdit={(readingId) => setModalState({ mode: 'edit', readingId })}
      />

      {data?.meta && totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            type="button"
            className={styles.paginationButton}
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
          >
            Anterior
          </button>

          <span className={styles.pageInfo}>
            Página {page} de {totalPages} ({data.meta.total} lecturas)
          </span>

          <button
            type="button"
            className={styles.paginationButton}
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
          >
            Siguiente
          </button>
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
