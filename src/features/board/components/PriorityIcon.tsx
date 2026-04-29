import { ChevronsDown, ChevronsUp, ChevronDown, ChevronUp, Equal } from 'lucide-react';
import type { Priority } from '../../../domain/board';
import { priorityLabels } from './priorityMeta';

type PriorityIconProps = {
  priority: Priority;
};

export function PriorityIcon({ priority }: PriorityIconProps) {
  const Icon =
    priority === 'highest'
      ? ChevronsUp
      : priority === 'high'
        ? ChevronUp
        : priority === 'medium'
          ? Equal
          : priority === 'low'
            ? ChevronDown
            : ChevronsDown;

  return (
    <span className={`priority-icon priority-icon--${priority}`} title={priorityLabels[priority]}>
      <Icon size={18} strokeWidth={3} />
    </span>
  );
}
