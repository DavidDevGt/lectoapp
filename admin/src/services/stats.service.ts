import { apiRequest } from './api-client';
import { DashboardStats } from '../types/api';

export const statsService = {
  getDashboard: () => apiRequest<DashboardStats>('/stats/dashboard'),
};
