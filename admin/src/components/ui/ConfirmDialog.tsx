import * as AlertDialog from '@radix-ui/react-alert-dialog';
import styles from './ConfirmDialog.module.css';
import modalStyles from './Modal.module.css';

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

/**
 * Confirmación de una acción destructiva, sobre Radix AlertDialog.
 *
 * Usa AlertDialog y no Dialog a propósito: expone `role="alertdialog"`, mueve el
 * foco inicial al botón de cancelar en lugar de al de confirmar, y no se cierra
 * al hacer clic fuera. Son exactamente las garantías que se esperan de un
 * "¿seguro que quieres eliminar?" y que la versión anterior, construida sobre el
 * Modal genérico, no daba.
 */
export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Eliminar',
  isPending = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <AlertDialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <AlertDialog.Portal>
        <AlertDialog.Overlay className={modalStyles.overlay} data-testid="confirm-overlay" />
        <AlertDialog.Content className={modalStyles.modal}>
          <AlertDialog.Title className={modalStyles.title}>{title}</AlertDialog.Title>
          <AlertDialog.Description className={styles.message}>{message}</AlertDialog.Description>

          <div className={styles.footer}>
            <AlertDialog.Cancel asChild>
              <button type="button" className={styles.secondaryButton} disabled={isPending}>
                Cancelar
              </button>
            </AlertDialog.Cancel>

            <button
              type="button"
              className={styles.dangerButton}
              disabled={isPending}
              onClick={onConfirm}
            >
              {isPending ? pendingLabelFor(confirmLabel) : confirmLabel}
            </button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
