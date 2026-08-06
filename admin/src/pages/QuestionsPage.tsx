import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import styles from './QuestionsPage.module.css';
import { useReading, usePublishReading } from '../hooks/useReadings';
import { useApproveQuestion, useDeleteQuestion, useQuestions } from '../hooks/useQuestions';
import { ApprovalProgress } from '../components/questions/ApprovalProgress';
import { QuestionCard } from '../components/questions/QuestionCard';
import { QuestionFormModal } from '../components/questions/QuestionFormModal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { ApiError } from '../services/api-client';
import { AdminQuestion, QuestionStatus } from '../types/api';
import { MIN_APPROVED_QUESTIONS_TO_PUBLISH } from '../utils/publishing';
import { mutateWithToast } from '../utils/mutationToast';

type StatusFilter = 'ALL' | QuestionStatus;

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: 'Todas' },
  { value: 'DRAFT', label: 'Pendientes de revisión' },
  { value: 'APPROVED', label: 'Aprobadas' },
];

function hasDuplicateOrder(questions: AdminQuestion[]): boolean {
  const orders = questions.map((q) => q.order);
  return new Set(orders).size !== orders.length;
}

interface QuestionsEmptyStateProps {
  statusFilter: StatusFilter;
  onAddQuestion: () => void;
}

function QuestionsEmptyState({ statusFilter, onAddQuestion }: QuestionsEmptyStateProps) {
  if (statusFilter === 'DRAFT') {
    return <p>No hay preguntas pendientes de revisión.</p>;
  }

  if (statusFilter === 'APPROVED') {
    return <p>No hay preguntas aprobadas.</p>;
  }

  return (
    <>
      <p>Esta lectura no tiene preguntas todavía.</p>
      <button type="button" className={styles.addButton} onClick={onAddQuestion}>
        Agregar la primera pregunta
      </button>
    </>
  );
}

export function QuestionsPage() {
  const { readingId = '' } = useParams<{ readingId: string }>();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<AdminQuestion | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const { data: reading, isLoading: isReadingLoading, isError: isReadingError } = useReading(readingId);
  const { data: allQuestions } = useQuestions(readingId);
  const {
    data: filteredQuestions,
    isLoading: isQuestionsLoading,
    isError: isQuestionsError,
    refetch,
  } = useQuestions(readingId, statusFilter === 'ALL' ? undefined : statusFilter);

  const publishReading = usePublishReading();
  const approveQuestion = useApproveQuestion(readingId);
  const deleteQuestion = useDeleteQuestion(readingId);

  const approvedCount = (allQuestions ?? []).filter((q) => q.status === 'APPROVED').length;
  const draftCount = (allQuestions ?? []).filter((q) => q.status === 'DRAFT').length;
  const canPublish = approvedCount >= MIN_APPROVED_QUESTIONS_TO_PUBLISH && reading?.status === 'DRAFT';

  const handlePublish = () => {
    mutateWithToast(publishReading.mutate, readingId, {
      successMessage: 'Lectura publicada',
      errorFallback: 'No se pudo publicar la lectura',
    });
  };

  const handleApprove = (id: string) => {
    mutateWithToast(approveQuestion.mutate, id, {
      successMessage: 'Pregunta aprobada',
      errorFallback: 'No se pudo aprobar la pregunta',
    });
  };

  const handleConfirmDelete = () => {
    if (!pendingDeleteId) return;
    deleteQuestion.mutate(pendingDeleteId, {
      onSuccess: () => {
        toast.success('Pregunta eliminada');
        setPendingDeleteId(null);
      },
      onError: (error) => {
        toast.error(error instanceof ApiError ? error.message : 'No se pudo eliminar la pregunta');
        refetch();
      },
    });
  };

  const questions = filteredQuestions ?? [];
  const sortedQuestions = [...questions].sort((a, b) => a.order - b.order);

  return (
    <div>
      <Link to="/readings" className={styles.backLink}>
        ← Volver a lecturas
      </Link>

      {isReadingError && (
        <div className={styles.errorState}>
          <p>No se pudo cargar la lectura</p>
          <Link to="/readings">Volver a lecturas</Link>
        </div>
      )}

      {!isReadingError && (
        <>
          <div className={styles.header}>
            <h1 className={styles.title}>{isReadingLoading ? 'Cargando lectura…' : reading?.title}</h1>
            <button
              type="button"
              className={styles.publishButton}
              disabled={!canPublish}
              onClick={handlePublish}
            >
              Publicar lectura
            </button>
          </div>

          <ApprovalProgress approvedCount={approvedCount} draftCount={draftCount} />

          <div className={styles.toolbar}>
            <div className={styles.filters}>
              {FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  className={`${styles.filterButton} ${statusFilter === filter.value ? styles.filterButtonActive : ''}`}
                  onClick={() => setStatusFilter(filter.value)}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <button type="button" className={styles.addButton} onClick={() => setIsAddOpen(true)}>
              Agregar pregunta
            </button>
          </div>

          {hasDuplicateOrder(sortedQuestions) && (
            <div className={styles.warning}>Hay preguntas con el mismo orden</div>
          )}

          {isQuestionsError && (
            <div className={styles.errorState}>
              <p>No se pudieron cargar las preguntas</p>
              <button type="button" className={styles.retryButton} onClick={() => refetch()}>
                Reintentar
              </button>
            </div>
          )}

          {!isQuestionsError && !isQuestionsLoading && sortedQuestions.length === 0 && (
            <div className={styles.emptyState}>
              <QuestionsEmptyState statusFilter={statusFilter} onAddQuestion={() => setIsAddOpen(true)} />
            </div>
          )}

          {!isQuestionsError &&
            sortedQuestions.map((question) => (
              <QuestionCard
                key={question.id}
                question={question}
                onEdit={() => setEditingQuestion(question)}
                onDelete={(id) => setPendingDeleteId(id)}
                onApprove={handleApprove}
                isApproving={approveQuestion.isPending}
              />
            ))}
        </>
      )}

      {isAddOpen && <QuestionFormModal readingId={readingId} onClose={() => setIsAddOpen(false)} />}

      {editingQuestion && (
        <QuestionFormModal
          readingId={readingId}
          question={editingQuestion}
          onClose={() => setEditingQuestion(null)}
        />
      )}

      {pendingDeleteId && (
        <ConfirmDialog
          title="Eliminar pregunta"
          message="¿Estás seguro de que deseas eliminar esta pregunta? Esta acción no se puede deshacer."
          isPending={deleteQuestion.isPending}
          onConfirm={handleConfirmDelete}
          onClose={() => setPendingDeleteId(null)}
        />
      )}
    </div>
  );
}
