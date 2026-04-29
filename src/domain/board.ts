export type ColumnId = 'backlog' | 'inProgress' | 'review' | 'done';
export type Priority = 'highest' | 'high' | 'medium' | 'low' | 'lowest';
export type TaskColor = 'none' | 'blue' | 'green' | 'yellow' | 'orange' | 'red' | 'purple';

export type Comment = {
  id: string;
  body: string;
  createdAt: string;
};

export type ChecklistItem = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
};

export type Task = {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  color: TaskColor;
  columnId: ColumnId;
  createdAt: string;
  updatedAt: string;
  comments: Comment[];
  checklist: ChecklistItem[];
};

export type Column = {
  id: ColumnId;
  title: string;
  taskIds: string[];
};

export type Board = {
  schemaVersion: 1;
  columns: Column[];
  tasks: Record<string, Task>;
};

export type Project = {
  id: string;
  name: string;
  board: Board;
  createdAt: string;
};

export type Workspace = {
  schemaVersion: 2;
  activeProjectId: string;
  projects: Project[];
};

export const columnOrder: ColumnId[] = ['backlog', 'inProgress', 'review', 'done'];
export const priorities: Priority[] = ['highest', 'high', 'medium', 'low', 'lowest'];
export const taskColors: TaskColor[] = ['none', 'blue', 'green', 'yellow', 'orange', 'red', 'purple'];

export const createEmptyBoard = (): Board => ({
  schemaVersion: 1,
  columns: [
    { id: 'backlog', title: 'Backlog', taskIds: [] },
    { id: 'inProgress', title: 'In progress', taskIds: [] },
    { id: 'review', title: 'Review', taskIds: [] },
    { id: 'done', title: 'Done', taskIds: [] },
  ],
  tasks: {},
});

export const createProject = (name: string, board = createEmptyBoard()): Project => ({
  id: crypto.randomUUID(),
  name,
  board,
  createdAt: new Date().toISOString(),
});

export const createEmptyWorkspace = (): Workspace => {
  const project = createProject('Work Grid');

  return {
    schemaVersion: 2,
    activeProjectId: project.id,
    projects: [project],
  };
};
