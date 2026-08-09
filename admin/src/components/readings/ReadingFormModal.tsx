import { useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '../ui/Modal';
import { ReadingForm, ReadingFormValues } from './ReadingForm';
import { useCreateReading, useReading, useUpdateReading } from '../../hooks/useReadings';
import { ApiError } from '../../services/api-client';
import { FieldErrorMap, hasFieldErrors, toFieldErrors } from '../../utils/apiFieldErrors';

type ReadingFormModalProps =
  | { mode: 'create'; onClose: () => void }
  | { mode: 'edit'; readingId: string; onClose: () => void };

export function ReadingFormModal(props: ReadingFormModalProps) {
  if (props.mode === 'create') {
    return <CreateReadingFormModal onClose={props.onClose} />;
  }

  return <EditReadingFormModal readingId={props.readingId} onClose={props.onClose} />;
}

/**
 * Reparte un error de guardado entre el formulario y el toast: si el backend
 * dice qué campos fallaron, se pintan ahí; si no, queda el mensaje general.
 */
function reportSaveError(
  error: unknown,
  fallback: string,
  setFieldErrors: (fieldErrors: FieldErrorMap) => void,
): void {
  const fieldErrors = toFieldErrors(error);

  if (hasFieldErrors(fieldErrors)) {
    setFieldErrors(fieldErrors);
    toast.error('Revisa los campos marcados');
    return;
  }

  toast.error(error instanceof ApiError ? error.message : fallback);
}

function CreateReadingFormModal({ onClose }: { onClose: () => void }) {
  const createReading = useCreateReading();
  const [fieldErrors, setFieldErrors] = useState<FieldErrorMap>({});

  const handleSubmit = async (values: ReadingFormValues) => {
    setFieldErrors({});
    try {
      await createReading.mutateAsync(values);
      toast.success('Lectura creada como borrador');
      onClose();
    } catch (error) {
      reportSaveError(error, 'No se pudo crear la lectura', setFieldErrors);
    }
  };

  return (
    <Modal title="Nueva lectura" onClose={onClose}>
      <ReadingForm
        submitLabel="Crear lectura"
        pendingLabel="Creando…"
        isPending={createReading.isPending}
        fieldErrors={fieldErrors}
        onSubmit={handleSubmit}
        onCancel={onClose}
      />
    </Modal>
  );
}

function EditReadingFormModal({ readingId, onClose }: { readingId: string; onClose: () => void }) {
  const { data: reading, isLoading, isError } = useReading(readingId);
  const updateReading = useUpdateReading();
  const [fieldErrors, setFieldErrors] = useState<FieldErrorMap>({});

  const handleSubmit = async (values: ReadingFormValues) => {
    setFieldErrors({});
    try {
      await updateReading.mutateAsync({ id: readingId, payload: values });
      toast.success('Lectura actualizada');
      onClose();
    } catch (error) {
      reportSaveError(error, 'No se pudo actualizar la lectura', setFieldErrors);
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
          fieldErrors={fieldErrors}
          onSubmit={handleSubmit}
          onCancel={onClose}
        />
      )}
    </Modal>
  );
}
