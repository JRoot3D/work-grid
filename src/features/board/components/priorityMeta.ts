import type { Priority } from '../../../domain/board';

export const priorityLabels: Record<Priority, string> = {
  highest: 'Highest priority',
  high: 'High priority',
  medium: 'Medium priority',
  low: 'Low priority',
  lowest: 'Lowest priority',
};

export function formatPriority(priority: Priority) {
  return priorityLabels[priority].replace(' priority', '');
}
