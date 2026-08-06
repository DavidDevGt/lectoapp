import { Modal } from './Modal';
import styles from './ConfirmDialog.module.css';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  isPending?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

function pendingLabelFor(confirmLabel: string): string {
  if (confirmLabel.toLowerCase().endsWith('ar')) {
    return `${confirmLabel.slice(0, -2)}ando…`;
  }
  return `${confirmLabel}…`;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Eliminar',
  isPending = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Modal title={title} onClose={onClose}>
      <p className={styles.message}>{message}</p>
      <div className={styles.footer}>
        <button type="button" className={styles.secondaryButton} onClick={onClose} disabled={isPending}>
          Cancelar
        </button>
        <button type="button" className={styles.dangerButton} onClick={onConfirm} disabled={isPending}>
          {isPending ? pendingLabelFor(confirmLabel) : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
