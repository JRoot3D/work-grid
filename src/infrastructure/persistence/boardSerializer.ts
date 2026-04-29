import {
  columnOrder,
  createEmptyBoard,
  priorities,
  taskColors,
  type Board,
  type ChecklistItem,
  type Column,
  type ColumnId,
  type Comment,
  type Priority,
  type Task,
  type TaskColor,
} from '../../domain/board';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isColumnId = (value: unknown): value is ColumnId =>
  typeof value === 'string' && columnOrder.includes(value as ColumnId);

const isPriority = (value: unknown): value is Priority =>
  typeof value === 'string' && priorities.includes(value as Priority);

const isTaskColor = (value: unknown): value is TaskColor =>
  typeof value === 'string' && taskColors.includes(value as TaskColor);

const isComment = (value: unknown): value is Comment =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.body === 'string' &&
  typeof value.createdAt === 'string';

const isChecklistItem = (value: unknown): value is ChecklistItem =>
  isRecord(value) &&
  typeof value.id === 'string' &&
  typeof value.title === 'string' &&
  typeof value.completed === 'boolean' &&
  typeof value.createdAt === 'string';

const normalizeTask = (value: unknown): Task | null => {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.title !== 'string' ||
    typeof value.description !== 'string' ||
    !isColumnId(value.columnId) ||
    typeof value.createdAt !== 'string' ||
    typeof value.updatedAt !== 'string' ||
    !Array.isArray(value.comments) ||
    !value.comments.every(isComment)
  ) {
    return null;
  }

  return {
    id: value.id,
    title: value.title,
    description: value.description,
    priority: isPriority(value.priority) ? value.priority : 'medium',
    color: isTaskColor(value.color) ? value.color : 'none',
    columnId: value.columnId,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    comments: value.comments,
    checklist: Array.isArray(value.checklist) ? value.checklist.filter(isChecklistItem) : [],
  };
};

const isColumn = (value: unknown): value is Column =>
  isRecord(value) &&
  isColumnId(value.id) &&
  typeof value.title === 'string' &&
  Array.isArray(value.taskIds) &&
  value.taskIds.every((id) => typeof id === 'string');

export function serializeBoard(board: Board): string {
  return JSON.stringify(board, null, 2);
}

export function parseBoard(json: string): Board {
  const parsed: unknown = JSON.parse(json);

  if (!isRecord(parsed) || parsed.schemaVersion !== 1 || !Array.isArray(parsed.columns) || !isRecord(parsed.tasks)) {
    throw new Error('Unsupported board file.');
  }

  const columns = parsed.columns;
  const tasks = Object.fromEntries(
    Object.entries(parsed.tasks).flatMap(([taskId, task]) => {
      const normalizedTask = normalizeTask(task);
      return normalizedTask ? [[taskId, normalizedTask]] : [];
    }),
  );

  if (!columns.every(isColumn)) {
    throw new Error('Board columns are invalid.');
  }

  const normalizedColumns = createEmptyBoard().columns.map((fallbackColumn) => {
    const imported = columns.find((column) => column.id === fallbackColumn.id);

    return {
      ...fallbackColumn,
      taskIds: (imported?.taskIds ?? []).filter((id) => tasks[id]?.columnId === fallbackColumn.id),
    };
  });

  return {
    schemaVersion: 1,
    columns: normalizedColumns,
    tasks,
  };
}
