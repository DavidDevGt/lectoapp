import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import styles from './ReadingForm.module.css';
import { FieldErrorMap } from '../../utils/apiFieldErrors';
import {
  COMPREHENSION_LEVEL_LABEL,
  COMPREHENSION_LEVEL_ORDER,
  PROGRESSION_LEVEL_LABEL,
  PROGRESSION_LEVEL_ORDER,
} from '../../utils/labels';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';

const emptyToUndefined = (value: unknown) => (value === '' || value === null ? undefined : value);

export const readingFormSchema = z.object({
  title: z.string().min(3, 'Mínimo 3 caracteres').max(200),
  content: z.string().min(50, 'Mínimo 50 caracteres'),
  comprehensionLevel: z.enum(['LITERAL', 'INFERENTIAL', 'CRITICAL']),
  progressionLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT', 'SUPREME']),
  estimatedTimeMin: z.preprocess(emptyToUndefined, z.coerce.number().int().positive().optional()),
  coverImageUrl: z.preprocess(emptyToUndefined, z.string().url('URL inválida').optional()),
});

export type ReadingFormValues = z.infer<typeof readingFormSchema>;

interface ReadingFormProps {
  defaultValues?: Partial<ReadingFormValues>;
  submitLabel: string;
  pendingLabel: string;
  isPending: boolean;
  fieldErrors?: FieldErrorMap;
  onSubmit: (values: ReadingFormValues) => void | Promise<void>;
  onCancel: () => void;
}

export function ReadingForm({
  defaultValues,
  submitLabel,
  pendingLabel,
  isPending,
  fieldErrors,
  onSubmit,
  onCancel,
}: ReadingFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ReadingFormValues>({
    resolver: zodResolver(readingFormSchema),
    defaultValues: {
      comprehensionLevel: 'LITERAL',
      progressionLevel: 'BEGINNER',
      ...defaultValues,
    },
  });

  useEffect(() => {
    if (!fieldErrors) return;
    for (const [field, message] of Object.entries(fieldErrors)) {
      if (field in readingFormSchema.shape) {
        setError(field as keyof ReadingFormValues, { type: 'server', message });
      }
    }
  }, [fieldErrors, setError]);

  const submit = handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <form onSubmit={submit} noValidate>
      <div className={styles.field}>
        <Input
          id="title"
          label="Título"
          error={errors.title?.message}
          {...register('title')}
        />
      </div>

      <div className={styles.field}>
        <Textarea
          id="content"
          label="Contenido"
          error={errors.content?.message}
          {...register('content')}
        />
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <Select
            id="comprehensionLevel"
            label="Nivel de comprensión"
            error={errors.comprehensionLevel?.message}
            {...register('comprehensionLevel')}
          >
            {COMPREHENSION_LEVEL_ORDER.map((level) => (
              <option key={level} value={level}>
                {COMPREHENSION_LEVEL_LABEL[level]}
              </option>
            ))}
          </Select>
        </div>

        <div className={styles.field}>
          <Select
            id="progressionLevel"
            label="Nivel de progresión"
            error={errors.progressionLevel?.message}
            {...register('progressionLevel')}
          >
            {PROGRESSION_LEVEL_ORDER.map((level) => (
              <option key={level} value={level}>
                {PROGRESSION_LEVEL_LABEL[level]}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className={styles.field}>
        <Input
          id="estimatedTimeMin"
          type="number"
          label="Tiempo estimado de lectura (min, opcional)"
          error={errors.estimatedTimeMin?.message}
          {...register('estimatedTimeMin')}
        />
      </div>

      <div className={styles.field}>
        <Input
          id="coverImageUrl"
          label="Imagen de portada (URL, opcional)"
          error={errors.coverImageUrl?.message}
          {...register('coverImageUrl')}
        />
      </div>

      <div className={styles.footer}>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" isLoading={isPending}>
          {isPending ? pendingLabel : submitLabel}
        </Button>
      </div>
    </form>
  );
}
