import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createTestQueryClient } from './test/renderWithProviders';
import { readingsService } from './services/readings.service';
import { questionsService } from './services/questions.service';
import { useAuthStore } from './stores/authStore';
import { App } from './App';
import { ReadingDetail } from './types/api';

vi.mock('./services/readings.service');
vi.mock('./services/questions.service');
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() }, Toaster: () => null }));
// Estos tests fijan la sesión a mano en el store. Sin neutralizar el bootstrap,
// éste llamaría a /auth/refresh contra un fetch inexistente en jsdom, fallaría y
// dejaría la sesión en 'anonymous' — mandando cada test al login.
// La rehidratación tiene sus propios tests en services/auth.service.test.ts.
vi.mock('./hooks/useSessionBootstrap', () => ({ useSessionBootstrap: () => {} }));

const mockedReadingsService = vi.mocked(readingsService, true);
const mockedQuestionsService = vi.mocked(questionsService, true);

const reading: ReadingDetail = {
  id: 'r1',
  title: 'El Popol Vuh',
  content: 'x'.repeat(60),
  comprehensionLevel: 'LITERAL',
  progressionLevel: 'BEGINNER',
  status: 'DRAFT',
  coverImageUrl: null,
  estimatedTimeMin: 8,
  order: 1,
  questions: [],
  author: { id: 'a1', name: 'Admin' },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function renderAppAt(path: string) {
  window.history.pushState({}, '', path);
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>,
  );
}

describe('App routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: { id: 'u1', name: 'Admin', email: 'admin@test.com', role: 'ADMIN', currentLevel: 'BEGINNER', totalPoints: 0, streak: 0 },
      accessToken: 'token',
      status: 'authenticated',
    });
    mockedReadingsService.getById.mockResolvedValue(reading);
    mockedQuestionsService.listByReading.mockResolvedValue([]);
  });

  it('should render QuestionsPage for /readings/:readingId/questions', async () => {
    renderAppAt('/readings/r1/questions');

    await waitFor(() => expect(screen.getByRole('heading', { name: /el popol vuh/i })).toBeInTheDocument(), {
      timeout: 5000,
    });
  });

  it('should render the ReadingPreviewPage for /readings/:readingId/preview', async () => {
    renderAppAt('/readings/r1/preview');

    await waitFor(() => expect(screen.getByRole('heading', { name: /el popol vuh/i })).toBeInTheDocument(), {
      timeout: 5000,
    });
  });
});
