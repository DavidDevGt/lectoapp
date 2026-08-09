import { ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import styles from './Modal.module.css';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Diálogo modal construido sobre Radix.
 *
 * Antes esto era una implementación propia de overlay + focus trap + manejo de
 * Escape. Radix resuelve por nosotros el trampeo de foco, la restauración del
 * foco al cerrar, `aria-modal`, el bloqueo del scroll de fondo y el marcado
 * `inert` del resto de la página — todo probado por terceros y en muchos más
 * navegadores y lectores de pantalla de los que podemos cubrir aquí.
 *
 * La API del componente no cambió: sigue siendo siempre-abierto y controlado
 * por el montaje, tal como lo usan las pantallas.
 */
export function Modal({ title, onClose, children }: ModalProps) {
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} data-testid="modal-overlay" />
        <Dialog.Content className={styles.modal} aria-describedby={undefined}>
          <Dialog.Title className={styles.title}>{title}</Dialog.Title>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
