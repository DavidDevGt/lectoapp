import { beforeEach, describe, it, vi } from 'vitest';
import { renderWithProviders } from './renderWithProviders';
import { useAuthStore } from '../stores/authStore';
import { expectNoA11yViolations } from './axe';
import { buildAdminQuestion, buildReadingListItem } from './fixtures';
import { Modal } from '../components/ui/Modal';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { QuestionCard } from '../components/questions/QuestionCard';
import { ApprovalProgress } from '../components/questions/ApprovalProgress';
import { ReadingTable } from '../components/readings/ReadingTable';
import { StatCard } from '../components/dashboard/StatCard';
import { LoginPage } from '../pages/LoginPage';

/**
 * Barrido de accesibilidad sobre los componentes que el administrador usa a
 * diario. Cubre los estados que importan, no solo el estado por defecto.
 */

describe('accesibilidad', () => {
  beforeEach(() => {
    // El store arranca en 'loading' mientras se comprueba la cookie de sesión, y
    // en ese estado LoginPage pinta el fallback de carga en vez del formulario.
    // Sin esto, el barrido de accesibilidad analizaría un «Cargando…».
    useAuthStore.getState().clearSession();
  });

  it('Modal no tiene violaciones bloqueantes', async () => {
    const { baseElement } = renderWithProviders(
      <Modal title="Nueva lectura" onClose={vi.fn()}>
        <label htmlFor="campo">Título</label>
        <input id="campo" />
      </Modal>,
    );
    await expectNoA11yViolations(baseElement as HTMLElement);
  });

  it('ConfirmDialog no tiene violaciones bloqueantes', async () => {
    const { baseElement } = renderWithProviders(
      <ConfirmDialog
        title="Eliminar pregunta"
        message="Esta acción no se puede deshacer."
        onConfirm={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    await expectNoA11yViolations(baseElement as HTMLElement);
  });

  it('QuestionCard no tiene violaciones bloqueantes, incluida una pregunta de IA en borrador', async () => {
    const { container } = renderWithProviders(
      <QuestionCard
        question={buildAdminQuestion({ isAiGenerated: true, status: 'DRAFT' })}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onApprove={vi.fn()}
        isApproving={false}
      />,
    );
    await expectNoA11yViolations(container);
  });

  it('ApprovalProgress no tiene violaciones bloqueantes', async () => {
    const { container } = renderWithProviders(
      <ApprovalProgress approvedCount={2} draftCount={3} />,
    );
    await expectNoA11yViolations(container);
  });

  it('ReadingTable no tiene violaciones bloqueantes con lecturas en los tres estados', async () => {
    const { container } = renderWithProviders(
      <ReadingTable
        isLoading={false}
        onEdit={vi.fn()}
        readings={[
          buildReadingListItem({ id: 'r1', status: 'DRAFT' }),
          buildReadingListItem({ id: 'r2', status: 'PUBLISHED', title: 'Lectura publicada' }),
          buildReadingListItem({ id: 'r3', status: 'ARCHIVED', title: 'Lectura archivada' }),
        ]}
      />,
    );
    await expectNoA11yViolations(container);
  });

  it('StatCard no tiene violaciones bloqueantes', async () => {
    const { container } = renderWithProviders(
      <StatCard label="Lecturas totales" value={12} hint="Revisar" to="/readings" />,
    );
    await expectNoA11yViolations(container);
  });

  it('LoginPage no tiene violaciones bloqueantes', async () => {
    const { container } = renderWithProviders(<LoginPage />);
    await expectNoA11yViolations(container);
  });
});
