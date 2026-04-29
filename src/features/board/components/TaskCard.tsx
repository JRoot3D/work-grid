import { Bookmark, Check, GitBranch, ListChecks, MessageSquare } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { Task } from '../../../domain/board';
import { PriorityIcon } from './PriorityIcon';
import { getTaskColorTintValue, getTaskColorValue } from './taskColorMeta';

type TaskCardProps = {
  task: Task;
  onOpen(): void;
  onDropBefore(taskId: string): void;
};

export function TaskCard({ task, onOpen, onDropBefore }: TaskCardProps) {
  const completedChecklistItems = task.checklist.filter((item) => item.completed).length;
  const issueKey = `WG-${task.id.slice(0, 4).toUpperCase()}`;
  const style = {
    '--task-color': getTaskColorValue(task.color),
    '--task-color-tint': getTaskColorTintValue(task.color),
  } as CSSProperties;

  const handleDragStart = (event: React.DragEvent<HTMLButtonElement>) => {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/task-id', task.id);
  };

  const handleDragOver = (event: React.DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const taskId = event.dataTransfer.getData('text/task-id');

    if (taskId && taskId !== task.id) {
      onDropBefore(taskId);
    }
  };

  return (
    <button
      className="task-card"
      style={style}
      type="button"
      draggable
      onClick={onOpen}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <span className="task-card__title">{task.title}</span>
      {task.description ? <span className="task-card__description">{task.description}</span> : null}
      <span className="task-card__meta">
        <span className="issue-type" title="Task">
          <Bookmark size={14} />
        </span>
        <span className="issue-key">{issueKey}</span>
        <MessageSquare size={14} />
        {task.comments.length}
        <GitBranch size={14} />
        {task.checklist.length > 0 ? (
          <>
            <ListChecks size={14} />
            {completedChecklistItems}/{task.checklist.length}
          </>
        ) : null}
        {task.checklist.length > 0 && completedChecklistItems === task.checklist.length ? <Check size={15} /> : null}
        <PriorityIcon priority={task.priority} />
      </span>
    </button>
  );
}
