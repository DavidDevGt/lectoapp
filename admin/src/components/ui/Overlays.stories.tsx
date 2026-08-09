import type { Meta, StoryObj } from '@storybook/react-vite';
import { Modal } from './Modal';
import { ConfirmDialog } from './ConfirmDialog';

/**
 * Las dos primitivas de overlay del panel, ambas sobre Radix.
 *
 * `Modal` (role="dialog") es para formularios. `ConfirmDialog`
 * (role="alertdialog") es para acciones destructivas: no se cierra al hacer clic
 * fuera y arranca con el foco en Cancelar, no en Eliminar.
 */
const meta = {
  title: 'UI/Overlays',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;

export const ModalConFormulario: StoryObj = {
  render: () => (
    <Modal title="Nueva lectura" onClose={() => {}}>
      <p>El foco entra al diálogo al abrir y vuelve al disparador al cerrar.</p>
      <label htmlFor="demo-title">Título</label>
      <input id="demo-title" defaultValue="El quetzal y la montaña" />
    </Modal>
  ),
};

export const ConfirmacionDestructiva: StoryObj = {
  render: () => (
    <ConfirmDialog
      title="Eliminar pregunta"
      message="¿Estás seguro de que deseas eliminar esta pregunta? Esta acción no se puede deshacer."
      onConfirm={() => {}}
      onClose={() => {}}
    />
  ),
};

export const ConfirmacionEnCurso: StoryObj = {
  render: () => (
    <ConfirmDialog
      title="Eliminar pregunta"
      message="¿Estás seguro de que deseas eliminar esta pregunta? Esta acción no se puede deshacer."
      isPending
      onConfirm={() => {}}
      onClose={() => {}}
    />
  ),
};
