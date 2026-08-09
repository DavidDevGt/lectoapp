import { AdminQuestion } from '../../types/api';
import styles from './QuestionCard.module.css';
import { QUESTION_STATUS_LABEL, QUESTION_TYPE_LABEL } from '../../utils/labels';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

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
        <Badge variant="brand">{QUESTION_TYPE_LABEL[question.type]}</Badge>
        <Badge variant={question.status === 'APPROVED' ? 'approved' : 'draft'}>
          {QUESTION_STATUS_LABEL[question.status]}
        </Badge>
        {question.isAiGenerated && <Badge variant="ai">Generada por IA</Badge>}
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
        <Button variant="secondary" size="sm" onClick={() => onEdit(question.id)}>
          Editar
        </Button>

        {question.status === 'DRAFT' && (
          <Button
            variant="primary"
            size="sm"
            isLoading={isApproving}
            onClick={() => onApprove(question.id)}
          >
            Aprobar
          </Button>
        )}

        <Button variant="danger" size="sm" onClick={() => onDelete(question.id)}>
          Eliminar
        </Button>
      </div>
    </article>
  );
}
