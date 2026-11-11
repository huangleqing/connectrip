import type { DashboardSummary } from '@/types';
import { http } from '@/utils/request';

export function getDashboardSummary() {
  return http.get<DashboardSummary>('/dashboard/summary');
}
