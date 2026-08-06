import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import styles from './ReadingForm.module.css';
import {
  COMPREHENSION_LEVEL_LABEL,
  COMPREHENSION_LEVEL_ORDER,
  PROGRESSION_LEVEL_LABEL,
  PROGRESSION_LEVEL_ORDER,
} from '../../utils/labels';

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
  onSubmit: (values: ReadingFormValues) => void | Promise<void>;
  onCancel: () => void;
}

export function ReadingForm({
  defaultValues,
  submitLabel,
  pendingLabel,
  isPending,
  onSubmit,
  onCancel,
}: ReadingFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReadingFormValues>({
    resolver: zodResolver(readingFormSchema),
    defaultValues: {
      comprehensionLevel: 'LITERAL',
      progressionLevel: 'BEGINNER',
      ...defaultValues,
    },
  });

  const submit = handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <form onSubmit={submit} noValidate>
      <div className={styles.field}>
        <label className={styles.label} htmlFor="title">
          Título
        </label>
        <input id="title" className={styles.input} {...register('title')} />
        {errors.title && <span className={styles.errorText}>{errors.title.message}</span>}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="content">
          Contenido
        </label>
        <textarea id="content" className={styles.textarea} {...register('content')} />
        {errors.content && <span className={styles.errorText}>{errors.content.message}</span>}
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="comprehensionLevel">
            Nivel de comprensión
          </label>
          <select id="comprehensionLevel" className={styles.select} {...register('comprehensionLevel')}>
            {COMPREHENSION_LEVEL_ORDER.map((level) => (
              <option key={level} value={level}>
                {COMPREHENSION_LEVEL_LABEL[level]}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="progressionLevel">
            Nivel de progresión
          </label>
          <select id="progressionLevel" className={styles.select} {...register('progressionLevel')}>
            {PROGRESSION_LEVEL_ORDER.map((level) => (
              <option key={level} value={level}>
                {PROGRESSION_LEVEL_LABEL[level]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="estimatedTimeMin">
          Tiempo estimado de lectura (min, opcional)
        </label>
        <input
          id="estimatedTimeMin"
          type="number"
          className={styles.input}
          {...register('estimatedTimeMin')}
        />
        {errors.estimatedTimeMin && (
          <span className={styles.errorText}>{errors.estimatedTimeMin.message}</span>
        )}
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="coverImageUrl">
          Imagen de portada (URL, opcional)
        </label>
        <input id="coverImageUrl" className={styles.input} {...register('coverImageUrl')} />
        {errors.coverImageUrl && <span className={styles.errorText}>{errors.coverImageUrl.message}</span>}
      </div>

      <div className={styles.footer}>
        <button type="button" className={styles.secondaryButton} onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className={styles.primaryButton} disabled={isPending}>
          {isPending ? pendingLabel : submitLabel}
        </button>
      </div>
    </form>
  );
}
