import { useQuery } from '@tanstack/react-query';
import { statsService } from '../services/stats.service';

export const statsKeys = {
  dashboard: ['stats', 'dashboard'] as const,
};

export function useDashboardStats() {
  return useQuery({
    queryKey: statsKeys.dashboard,
    queryFn: () => statsService.getDashboard(),
    staleTime: 60_000,
  });
}
