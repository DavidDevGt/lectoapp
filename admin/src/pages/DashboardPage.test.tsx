import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test/renderWithProviders';
import { statsService } from '../services/stats.service';
import { useAuthStore } from '../stores/authStore';
import { MockResponsiveContainer } from '../test/mockRecharts';
import { DashboardPage } from './DashboardPage';
import { DashboardStats } from '../types/api';

vi.mock('../services/stats.service');
vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('recharts')>();
  return { ...actual, ResponsiveContainer: MockResponsiveContainer };
});

const mockedStatsService = vi.mocked(statsService, true);

function makeStats(overrides: Partial<DashboardStats> = {}): DashboardStats {
  return {
    readings: { total: 12, byStatus: { DRAFT: 4, PUBLISHED: 7, ARCHIVED: 1 } },
    questions: { total: 60, byStatus: { APPROVED: 52, DRAFT: 8 } },
    students: {
      total: 40,
      active: 12,
      activeWithinDays: 7,
      byProgressionLevel: { BEGINNER: 20, INTERMEDIATE: 12, ADVANCED: 5, EXPERT: 2, SUPREME: 1 },
    },
    quizAttempts: { total: 130, passed: 90, passRatePercentage: 69.2, averageScorePercentage: 71.4 },
    topReadings: [
      { readingId: 'r1', title: 'El Popol Vuh', completions: 18, averageScorePercentage: 84.3 },
    ],
    ...overrides,
  };
}

function renderPage() {
  return renderWithProviders(<DashboardPage />);
}

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: {
        id: 'u1',
        name: 'Giovanni',
        email: 'giovanni@example.com',
        role: 'ADMIN',
        currentLevel: 'BEGINNER',
        totalPoints: 0,
        streak: 0,
      },
      accessToken: 'token',
      refreshToken: 'refresh',
    });
  });

  it('should show a loading skeleton while fetching stats', () => {
    mockedStatsService.getDashboard.mockReturnValue(new Promise(() => {}));

    renderPage();

    expect(screen.getByTestId('dashboard-skeleton')).toBeInTheDocument();
  });

  it('should show reading totals', async () => {
    mockedStatsService.getDashboard.mockResolvedValue(makeStats());

    renderPage();

    await waitFor(() =>
      expect(screen.getByRole('article', { name: /lecturas totales/i })).toHaveTextContent('12'),
    );
    expect(screen.getByRole('article', { name: /publicadas/i })).toHaveTextContent('7');
  });

  it('should show pending questions count with a link to review them when there are drafts', async () => {
    mockedStatsService.getDashboard.mockResolvedValue(makeStats());

    renderPage();

    await waitFor(() =>
      expect(screen.getByRole('article', { name: /pendientes de revisión/i })).toHaveTextContent('8'),
    );
    expect(screen.getByRole('link', { name: /revisar preguntas pendientes/i })).toBeInTheDocument();
  });

  it('should not show the review link when there are no draft questions', async () => {
    mockedStatsService.getDashboard.mockResolvedValue(
      makeStats({ questions: { total: 52, byStatus: { APPROVED: 52, DRAFT: 0 } } }),
    );

    renderPage();

    await waitFor(() =>
      expect(screen.getByRole('article', { name: /pendientes de revisión/i })).toHaveTextContent('0'),
    );
    expect(
      screen.queryByRole('link', { name: /revisar preguntas pendientes/i }),
    ).not.toBeInTheDocument();
  });

  it('should show the quiz pass rate formatted with a percent sign', async () => {
    mockedStatsService.getDashboard.mockResolvedValue(
      makeStats({
        quizAttempts: { total: 340, passed: 246, passRatePercentage: 72.5, averageScorePercentage: 78.1 },
      }),
    );

    renderPage();

    await waitFor(() =>
      expect(screen.getByRole('article', { name: /tasa de aprobación/i })).toHaveTextContent('72.5%'),
    );
  });

  it('should render all three charts when data is present', async () => {
    mockedStatsService.getDashboard.mockResolvedValue(makeStats());

    renderPage();

    await waitFor(() => expect(screen.getByTestId('chart-readings-by-status')).toBeInTheDocument());
    expect(screen.getByTestId('chart-students-by-level')).toBeInTheDocument();
    expect(screen.getByTestId('chart-top-readings')).toBeInTheDocument();
  });

  it('should show "Sin datos suficientes" inside the top readings chart when there are none', async () => {
    mockedStatsService.getDashboard.mockResolvedValue(makeStats({ topReadings: [] }));

    renderPage();

    await waitFor(() => {
      const container = screen.getByTestId('chart-top-readings');
      expect(container).toBeInTheDocument();
    });
    expect(screen.getByText(/sin datos suficientes/i)).toBeInTheDocument();
  });

  it('should cap the top readings bars at 5 with more items', async () => {
    mockedStatsService.getDashboard.mockResolvedValue(
      makeStats({
        topReadings: Array.from({ length: 8 }, (_, i) => ({
          readingId: `r${i}`,
          title: `Lectura ${i}`,
          completions: 8 - i,
          averageScorePercentage: 80,
        })),
      }),
    );

    renderPage();

    await waitFor(() => expect(screen.getAllByTestId('top-reading-bar')).toHaveLength(5));
  });

  it('should show an error message with a retry button when the request fails, and refetch on click', async () => {
    const user = userEvent.setup();
    mockedStatsService.getDashboard.mockRejectedValue(new Error('Forbidden'));

    renderPage();

    await waitFor(() =>
      expect(screen.getByText(/no se pudieron cargar las métricas/i)).toBeInTheDocument(),
    );

    await user.click(screen.getByRole('button', { name: /reintentar/i }));

    await waitFor(() => expect(mockedStatsService.getDashboard).toHaveBeenCalledTimes(2));
  });

  it('should render a literal 0 when all totals are 0', async () => {
    mockedStatsService.getDashboard.mockResolvedValue(
      makeStats({
        readings: { total: 0, byStatus: { DRAFT: 0, PUBLISHED: 0, ARCHIVED: 0 } },
        questions: { total: 0, byStatus: { APPROVED: 0, DRAFT: 0 } },
        students: {
          total: 0,
          active: 0,
          activeWithinDays: 7,
          byProgressionLevel: { BEGINNER: 0, INTERMEDIATE: 0, ADVANCED: 0, EXPERT: 0, SUPREME: 0 },
        },
        quizAttempts: { total: 0, passed: 0, passRatePercentage: 0, averageScorePercentage: 0 },
        topReadings: [],
      }),
    );

    renderPage();

    await waitFor(() =>
      expect(screen.getByRole('article', { name: /estudiantes/i })).toHaveTextContent('0'),
    );
  });

  it('should not throw and should still show "Supremo" when byProgressionLevel is missing the SUPREME key', async () => {
    const statsWithoutSupreme = makeStats();
    const byProgressionLevel = { ...statsWithoutSupreme.students.byProgressionLevel };
    delete (byProgressionLevel as Partial<typeof byProgressionLevel>).SUPREME;

    mockedStatsService.getDashboard.mockResolvedValue({
      ...statsWithoutSupreme,
      students: { ...statsWithoutSupreme.students, byProgressionLevel },
    });

    renderPage();

    await waitFor(() => expect(screen.getByText(/supremo/i)).toBeInTheDocument());
  });
});
