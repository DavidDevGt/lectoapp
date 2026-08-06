import { toast } from 'sonner';
import { Modal } from '../ui/Modal';
import { ReadingForm, ReadingFormValues } from './ReadingForm';
import { useCreateReading, useReading, useUpdateReading } from '../../hooks/useReadings';
import { ApiError } from '../../services/api-client';

type ReadingFormModalProps =
  | { mode: 'create'; onClose: () => void }
  | { mode: 'edit'; readingId: string; onClose: () => void };

export function ReadingFormModal(props: ReadingFormModalProps) {
  if (props.mode === 'create') {
    return <CreateReadingFormModal onClose={props.onClose} />;
  }

  return <EditReadingFormModal readingId={props.readingId} onClose={props.onClose} />;
}

function CreateReadingFormModal({ onClose }: { onClose: () => void }) {
  const createReading = useCreateReading();

  const handleSubmit = async (values: ReadingFormValues) => {
    try {
      await createReading.mutateAsync(values);
      toast.success('Lectura creada como borrador');
      onClose();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo crear la lectura');
    }
  };

  return (
    <Modal title="Nueva lectura" onClose={onClose}>
      <ReadingForm
        submitLabel="Crear lectura"
        pendingLabel="Creando…"
        isPending={createReading.isPending}
        onSubmit={handleSubmit}
        onCancel={onClose}
      />
    </Modal>
  );
}

function EditReadingFormModal({ readingId, onClose }: { readingId: string; onClose: () => void }) {
  const { data: reading, isLoading, isError } = useReading(readingId);
  const updateReading = useUpdateReading();

  const handleSubmit = async (values: ReadingFormValues) => {
    try {
      await updateReading.mutateAsync({ id: readingId, payload: values });
      toast.success('Lectura actualizada');
      onClose();
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : 'No se pudo actualizar la lectura');
    }
  };

  return (
    <Modal title="Editar lectura" onClose={onClose}>
      {isLoading && <p>Cargando lectura…</p>}

      {isError && (
        <div>
          <p>No se pudo cargar la lectura</p>
          <button type="button" onClick={onClose}>
            Cerrar
          </button>
        </div>
      )}

      {reading && (
        <ReadingForm
          key={reading.id}
          defaultValues={{
            title: reading.title,
            content: reading.content,
            comprehensionLevel: reading.comprehensionLevel,
            progressionLevel: reading.progressionLevel,
            estimatedTimeMin: reading.estimatedTimeMin ?? undefined,
            coverImageUrl: reading.coverImageUrl ?? undefined,
          }}
          submitLabel="Guardar"
          pendingLabel="Guardando…"
          isPending={updateReading.isPending}
          onSubmit={handleSubmit}
          onCancel={onClose}
        />
      )}
    </Modal>
  );
}
