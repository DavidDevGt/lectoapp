import { AdminQuestion } from '../../types/api';
import styles from './QuestionCard.module.css';
import { QUESTION_STATUS_LABEL, QUESTION_TYPE_LABEL } from '../../utils/labels';

interface QuestionCardProps {
  question: AdminQuestion;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onApprove: (id: string) => void;
  isApproving: boolean;
}

export function QuestionCard({ question, onEdit, onDelete, onApprove, isApproving }: QuestionCardProps) {
  return (
    <article className={styles.card} role="article" data-status={question.status}>
      <div className={styles.header}>
        <span className={styles.order}>#{question.order}</span>
        <span className={`${styles.badge} ${styles.badgeType}`}>{QUESTION_TYPE_LABEL[question.type]}</span>
        <span
          className={`${styles.badge} ${question.status === 'APPROVED' ? styles.badgeApproved : styles.badgeDraft}`}
        >
          {QUESTION_STATUS_LABEL[question.status]}
        </span>
        {question.isAiGenerated && <span className={`${styles.badge} ${styles.badgeAi}`}>Generada por IA</span>}
      </div>

      <p className={styles.statement}>{question.statement}</p>

      <ul className={styles.options}>
        {question.options.map((option) => (
          <li key={option.id} className={styles.option}>
            {option.text}
            {option.id === question.correctAnswer && (
              <span className={styles.correctMark}>Respuesta correcta</span>
            )}
          </li>
        ))}
      </ul>

      {question.explanation && <p className={styles.explanation}>{question.explanation}</p>}

      <div className={styles.actions}>
        <button type="button" className={styles.actionButton} onClick={() => onEdit(question.id)}>
          Editar
        </button>
        {question.status === 'DRAFT' && (
          <button
            type="button"
            className={styles.actionButton}
            disabled={isApproving}
            onClick={() => onApprove(question.id)}
          >
            Aprobar
          </button>
        )}
        <button type="button" className={styles.dangerButton} onClick={() => onDelete(question.id)}>
          Eliminar
        </button>
      </div>
    </article>
  );
}
