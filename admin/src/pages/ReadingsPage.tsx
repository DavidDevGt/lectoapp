import { useState } from 'react';
import styles from './ReadingsPage.module.css';
import { useReadings } from '../hooks/useReadings';
import { ReadingTable } from '../components/readings/ReadingTable';
import { ReadingFormModal } from '../components/readings/ReadingFormModal';

type ModalState = { mode: 'create' } | { mode: 'edit'; readingId: string } | null;

export function ReadingsPage() {
  const [modalState, setModalState] = useState<ModalState>(null);
  const { data, isLoading, isError } = useReadings({ page: 1, limit: 20 });

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Lecturas</h1>
        <button className={styles.createButton} onClick={() => setModalState({ mode: 'create' })}>
          Nueva lectura
        </button>
      </div>

      {isError && <p style={{ color: '#dc2626' }}>No se pudieron cargar las lecturas.</p>}

      <ReadingTable
        readings={data?.items ?? []}
        isLoading={isLoading}
        onEdit={(readingId) => setModalState({ mode: 'edit', readingId })}
      />

      {modalState?.mode === 'create' && (
        <ReadingFormModal mode="create" onClose={() => setModalState(null)} />
      )}

      {modalState?.mode === 'edit' && (
        <ReadingFormModal mode="edit" readingId={modalState.readingId} onClose={() => setModalState(null)} />
      )}
    </div>
  );
}
