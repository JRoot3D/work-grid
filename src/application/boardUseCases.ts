import { columnOrder, type Board, type ChecklistItem, type ColumnId, type Priority, type Task, type TaskColor } from '../domain/board';

type CreateTaskInput = {
  title: string;
  description: string;
  priority?: Priority;
  color?: TaskColor;
  checklist?: string[];
  columnId?: ColumnId;
};

type UpdateTaskInput = {
  title: string;
  description: string;
  priority: Priority;
  color: TaskColor;
};

const createId = () => crypto.randomUUID();
const now = () => new Date().toISOString();

export function createTask(board: Board, input: CreateTaskInput): Board {
  const title = input.title.trim();
  const description = input.description.trim();
  const columnId = input.columnId ?? 'backlog';

  if (!title) {
    return board;
  }

  const timestamp = now();
  const checklist: ChecklistItem[] = (input.checklist ?? [])
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => ({
      id: createId(),
      title: item,
      completed: false,
      createdAt: timestamp,
    }));
  const task: Task = {
    id: createId(),
    title,
    description,
    priority: input.priority ?? 'medium',
    color: input.color ?? 'none',
    columnId,
    createdAt: timestamp,
    updatedAt: timestamp,
    comments: [],
    checklist,
  };

  return {
    ...board,
    tasks: { ...board.tasks, [task.id]: task },
    columns: board.columns.map((column) =>
      column.id === columnId ? { ...column, taskIds: [task.id, ...column.taskIds] } : column,
    ),
  };
}

export function updateTask(board: Board, taskId: string, input: UpdateTaskInput): Board {
  const current = board.tasks[taskId];
  const title = input.title.trim();

  if (!current || !title) {
    return board;
  }

  return {
    ...board,
    tasks: {
      ...board.tasks,
      [taskId]: {
        ...current,
        title,
        description: input.description.trim(),
        priority: input.priority,
        color: input.color,
        updatedAt: now(),
      },
    },
  };
}

export function deleteTask(board: Board, taskId: string): Board {
  if (!board.tasks[taskId]) {
    return board;
  }

  const tasks = { ...board.tasks };
  delete tasks[taskId];

  return {
    ...board,
    tasks,
    columns: board.columns.map((column) => ({
      ...column,
      taskIds: column.taskIds.filter((id) => id !== taskId),
    })),
  };
}

export function moveTask(board: Board, taskId: string, targetColumnId: ColumnId, targetIndex = 0): Board {
  const task = board.tasks[taskId];

  if (!task) {
    return board;
  }

  const cleanColumns = board.columns.map((column) => ({
    ...column,
    taskIds: column.taskIds.filter((id) => id !== taskId),
  }));

  const columns = cleanColumns.map((column) => {
    if (column.id !== targetColumnId) {
      return column;
    }

    const nextTaskIds = [...column.taskIds];
    nextTaskIds.splice(Math.max(0, Math.min(targetIndex, nextTaskIds.length)), 0, taskId);

    return { ...column, taskIds: nextTaskIds };
  });

  return {
    ...board,
    columns,
    tasks: {
      ...board.tasks,
      [taskId]: { ...task, columnId: targetColumnId, updatedAt: now() },
    },
  };
}

export function moveTaskToAdjacentColumn(board: Board, taskId: string, direction: -1 | 1): Board {
  const task = board.tasks[taskId];

  if (!task) {
    return board;
  }

  const currentIndex = columnOrder.indexOf(task.columnId);
  const nextColumnId = columnOrder[currentIndex + direction];

  return nextColumnId ? moveTask(board, taskId, nextColumnId, 0) : board;
}

export function addComment(board: Board, taskId: string, body: string): Board {
  const task = board.tasks[taskId];
  const text = body.trim();

  if (!task || !text) {
    return board;
  }

  return {
    ...board,
    tasks: {
      ...board.tasks,
      [taskId]: {
        ...task,
        comments: [{ id: createId(), body: text, createdAt: now() }, ...task.comments],
        updatedAt: now(),
      },
    },
  };
}

export function addChecklistItem(board: Board, taskId: string, title: string): Board {
  const task = board.tasks[taskId];
  const text = title.trim();

  if (!task || !text) {
    return board;
  }

  return {
    ...board,
    tasks: {
      ...board.tasks,
      [taskId]: {
        ...task,
        checklist: [{ id: createId(), title: text, completed: false, createdAt: now() }, ...task.checklist],
        updatedAt: now(),
      },
    },
  };
}

export function toggleChecklistItem(board: Board, taskId: string, itemId: string): Board {
  const task = board.tasks[taskId];

  if (!task) {
    return board;
  }

  return {
    ...board,
    tasks: {
      ...board.tasks,
      [taskId]: {
        ...task,
        checklist: task.checklist.map((item) =>
          item.id === itemId ? { ...item, completed: !item.completed } : item,
        ),
        updatedAt: now(),
      },
    },
  };
}

export function deleteChecklistItem(board: Board, taskId: string, itemId: string): Board {
  const task = board.tasks[taskId];

  if (!task) {
    return board;
  }

  return {
    ...board,
    tasks: {
      ...board.tasks,
      [taskId]: {
        ...task,
        checklist: task.checklist.filter((item) => item.id !== itemId),
        updatedAt: now(),
      },
    },
  };
}
