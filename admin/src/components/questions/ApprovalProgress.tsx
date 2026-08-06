import styles from './ApprovalProgress.module.css';
import { MIN_APPROVED_QUESTIONS_TO_PUBLISH } from '../../utils/publishing';

interface ApprovalProgressProps {
  approvedCount: number;
  draftCount: number;
}

export function ApprovalProgress({ approvedCount, draftCount }: ApprovalProgressProps) {
  const isReady = approvedCount >= MIN_APPROVED_QUESTIONS_TO_PUBLISH;
  const missing = MIN_APPROVED_QUESTIONS_TO_PUBLISH - approvedCount;

  return (
    <div className={`${styles.banner} ${isReady ? styles.ready : ''}`}>
      {isReady ? (
        <span>Lista para publicar · {approvedCount} aprobadas</span>
      ) : (
        <span>
          {approvedCount} de {MIN_APPROVED_QUESTIONS_TO_PUBLISH} preguntas aprobadas — faltan {missing}{' '}
          preguntas aprobadas para publicar ({draftCount} en revisión)
        </span>
      )}
    </div>
  );
}
