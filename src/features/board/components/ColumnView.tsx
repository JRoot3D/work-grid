import type { Column, ColumnId, Task } from '../../../domain/board';
import { TaskCard } from './TaskCard';

type ColumnViewProps = {
  column: Column;
  tasks: Task[];
  onDropTask(taskId: string, columnId: ColumnId, targetIndex: number): void;
  onOpenTask(taskId: string): void;
};

export function ColumnView({ column, tasks, onDropTask, onOpenTask }: ColumnViewProps) {
  const handleDragOver = (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent<HTMLElement>) => {
    event.preventDefault();
    const taskId = event.dataTransfer.getData('text/task-id');

    if (taskId) {
      onDropTask(taskId, column.id, tasks.length);
    }
  };

  return (
    <article className="column" onDragOver={handleDragOver} onDrop={handleDrop}>
      <header className="column__header">
        <h2>{column.title}</h2>
        <span>{tasks.length}</span>
      </header>

      <div className="column__list">
        {tasks.map((task, index) => (
          <TaskCard
            key={task.id}
            task={task}
            onOpen={() => onOpenTask(task.id)}
            onDropBefore={(taskId) => onDropTask(taskId, column.id, index)}
          />
        ))}

        {tasks.length === 0 ? <p className="column__empty">Drop tasks here</p> : null}
      </div>
    </article>
  );
}
