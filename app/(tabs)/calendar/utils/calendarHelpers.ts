import { EventPriority, PriorityColorConfig } from '../types';
import { getCountdownLabel, todayISO } from '@/utils/date';

/**
 * Get days remaining text from a reference date (defaults to today)
 */
export const getDeadlineBadgeText = (dateStr: string, referenceDateStr: string = todayISO()): string =>
  getCountdownLabel(dateStr, referenceDateStr);

/**
 * Get deadline priority color styling
 */
export const getPriorityColors = (priority: EventPriority): PriorityColorConfig => {
  switch (priority) {
    case 'High':
      return { text: '#FCA5A5', bg: '#7F1D1D', dot: '#EF4444' };
    case 'Medium':
      return { text: '#FDBA74', bg: '#7C2D12', dot: '#F59E0B' };
    case 'Low':
      return { text: '#86EFAC', bg: '#14532D', dot: '#10B981' };
    default:
      return { text: '#FDBA74', bg: '#7C2D12', dot: '#F59E0B' };
  }
};
