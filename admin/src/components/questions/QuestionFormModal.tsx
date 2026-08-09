import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Modal } from '../ui/Modal';
import styles from './QuestionFormModal.module.css';
import {
  MULTIPLE_CHOICE_OPTIONS,
  QuestionFormValues,
  TRUE_FALSE_OPTIONS,
  buildOptions,
  optionText,
  questionFormSchema,
} from './QuestionFormModal.schema';
import { useCreateQuestion, useQuestions, useUpdateQuestion } from '../../hooks/useQuestions';
import { ApiError } from '../../services/api-client';
import { AdminQuestion, CreateQuestionPayload, QuestionType } from '../../types/api';
import { QUESTION_TYPE_LABEL } from '../../utils/labels';
import { hasFieldErrors, toFieldErrors } from '../../utils/apiFieldErrors';

interface QuestionFormModalProps {
  readingId: string;
  question?: AdminQuestion;
  onClose: () => void;
}

/*
 * `questionFormSchema` lleva un `superRefine`, así que es un ZodEffects y no
 * expone `.shape`. Los campos se listan aquí de forma explícita; el tipo
 * `keyof QuestionFormValues` hace que TypeScript avise si alguno desaparece
 * del formulario.
 */
const QUESTION_FORM_FIELDS: readonly (keyof QuestionFormValues)[] = [
  'statement',
  'type',
  'optionA',
  'optionB',
  'optionC',
  'optionD',
  'correctAnswer',
  'explanation',
  'order',
];

function isQuestionFormField(field: string): field is keyof QuestionFormValues {
  return (QUESTION_FORM_FIELDS as readonly string[]).includes(field);
}

export function QuestionFormModal({ readingId, question, onClose }: QuestionFormModalProps) {
  const { data: existingQuestions } = useQuestions(readingId);
  const createQuestion = useCreateQuestion(readingId);
  const updateQuestion = useUpdateQuestion(readingId);
  const isPending = createQuestion.isPending || updateQuestion.isPending;

  const defaultOrder = question ? question.order : (existingQuestions?.length ?? 0) + 1;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<QuestionFormValues>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      statement: question?.statement ?? '',
      type: question?.type ?? 'MULTIPLE_CHOICE',
      optionA: question ? optionText(question.options, 'a') : '',
      optionB: question ? optionText(question.options, 'b') : '',
      optionC: question ? optionText(question.options, 'c') : '',
      optionD: question ? optionText(question.options, 'd') : '',
      correctAnswer: question?.correctAnswer ?? '',
      explanation: question?.explanation ?? '',
      order: defaultOrder,
    },
  });

  useEffect(() => {
    if (!question && existingQuestions) {
      setValue('order', existingQuestions.length + 1);
    }
  }, [existingQuestions, question, setValue]);

  const type = watch('type');

  const handleTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = event.target.value as QuestionType;
    setValue('correctAnswer', '');
    if (newType === 'MULTIPLE_CHOICE') {
      setValue('optionA', '');
      setValue('optionB', '');
      setValue('optionC', '');
      setValue('optionD', '');
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    const payload: CreateQuestionPayload = {
      statement: values.statement,
      type: values.type,
      options: buildOptions(values),
      correctAnswer: values.correctAnswer,
      explanation: values.explanation?.trim() ? values.explanation.trim() : undefined,
      order: values.order,
    };

    try {
      if (question) {
        await updateQuestion.mutateAsync({ id: question.id, payload });
        toast.success('Pregunta actualizada');
      } else {
        await createQuestion.mutateAsync(payload);
        toast.success('Pregunta creada');
      }
      onClose();
    } catch (error) {
      // El backend rechaza por reglas que el schema del cliente no replica
      // (enunciado duplicado, orden ocupado). Cuando señala campos concretos,
      // el mensaje va junto al input y no en un toast que desaparece.
      const fieldErrors = toFieldErrors(error);

      if (hasFieldErrors(fieldErrors)) {
        for (const [field, message] of Object.entries(fieldErrors)) {
          if (isQuestionFormField(field)) {
            setError(field, { type: 'server', message });
          }
        }
        toast.error('Revisa los campos marcados');
        return;
      }

      toast.error(error instanceof ApiError ? error.message : 'No se pudo guardar la pregunta');
    }
  });

  return (
    <Modal title={question ? 'Editar pregunta' : 'Nueva pregunta'} onClose={onClose}>
      <form onSubmit={onSubmit} noValidate>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="statement">
            Enunciado
          </label>
          <textarea id="statement" className={styles.textarea} {...register('statement')} />
          {errors.statement && <span className={styles.errorText}>{errors.statement.message}</span>}
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="type">
            Tipo de pregunta
          </label>
          <select
            id="type"
            className={styles.select}
            {...register('type', { onChange: handleTypeChange })}
          >
            <option value="MULTIPLE_CHOICE">{QUESTION_TYPE_LABEL.MULTIPLE_CHOICE}</option>
            <option value="TRUE_FALSE">{QUESTION_TYPE_LABEL.TRUE_FALSE}</option>
          </select>
        </div>

        {type === 'MULTIPLE_CHOICE' ? (
          <div className={styles.field}>
            <span className={styles.label}>Opciones</span>
            {MULTIPLE_CHOICE_OPTIONS.map(({ id, field }) => (
              <div key={id} className={styles.optionRow}>
                <label className={styles.optionLabel}>
                  <input type="radio" value={id} {...register('correctAnswer')} />
                  {id.toUpperCase()}
                </label>
                <input
                  aria-label={`Opción ${id.toUpperCase()}`}
                  className={styles.optionInput}
                  {...register(field)}
                />
                {errors[field] && <span className={styles.errorText}>{errors[field]?.message}</span>}
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.field}>
            <span className={styles.label}>Respuesta correcta</span>
            {TRUE_FALSE_OPTIONS.map((option) => (
              <label key={option.id} className={styles.optionLabel}>
                <input type="radio" value={option.id} {...register('correctAnswer')} />
                {option.text}
              </label>
            ))}
          </div>
        )}
        {errors.correctAnswer && <span className={styles.errorText}>{errors.correctAnswer.message}</span>}

        <div className={styles.field}>
          <label className={styles.label} htmlFor="explanation">
            Explicación (opcional)
          </label>
          <textarea id="explanation" className={styles.textarea} {...register('explanation')} />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="order">
            Orden
          </label>
          <input id="order" type="number" className={styles.input} {...register('order')} />
        </div>

        <div className={styles.footer}>
          <button type="button" className={styles.secondaryButton} onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className={styles.primaryButton} disabled={isPending}>
            {isPending ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
