import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
  addComment as addCommentUseCase,
  addChecklistItem as addChecklistItemUseCase,
  createTask as createTaskUseCase,
  deleteChecklistItem as deleteChecklistItemUseCase,
  deleteTask as deleteTaskUseCase,
  moveTask as moveTaskUseCase,
  moveTaskToAdjacentColumn as moveTaskToAdjacentColumnUseCase,
  toggleChecklistItem as toggleChecklistItemUseCase,
  updateTask as updateTaskUseCase,
} from '../../../application/boardUseCases';
import { createEmptyWorkspace, createProject, type Board, type ColumnId, type Priority, type TaskColor, type Workspace } from '../../../domain/board';
import type { RootState } from '../../../app/store';

type CreateTaskPayload = {
  title: string;
  description: string;
  priority?: Priority;
  color?: TaskColor;
  checklist?: string[];
  columnId?: ColumnId;
};

type UpdateTaskPayload = {
  taskId: string;
  input: {
    title: string;
    description: string;
    priority: Priority;
    color: TaskColor;
  };
};

type MoveTaskPayload = {
  taskId: string;
  targetColumnId: ColumnId;
  targetIndex?: number;
};

type MoveTaskToAdjacentColumnPayload = {
  taskId: string;
  direction: -1 | 1;
};

type AddCommentPayload = {
  taskId: string;
  body: string;
};

type AddChecklistItemPayload = {
  taskId: string;
  title: string;
};

type ChecklistItemPayload = {
  taskId: string;
  itemId: string;
};

type CreateProjectPayload = {
  name: string;
};

const getActiveProject = (state: Workspace) =>
  state.projects.find((project) => project.id === state.activeProjectId) ?? state.projects[0];

const updateActiveBoard = (state: Workspace, recipe: (board: Board) => Board) => {
  const activeProject = getActiveProject(state);

  if (activeProject) {
    activeProject.board = recipe(activeProject.board);
  }
};

const workspaceSlice = createSlice({
  name: 'workspace',
  initialState: createEmptyWorkspace(),
  reducers: {
    projectCreated: (state, action: PayloadAction<CreateProjectPayload>) => {
      const name = action.payload.name.trim();

      if (!name) {
        return;
      }

      const project = createProject(name);
      state.projects.unshift(project);
      state.activeProjectId = project.id;
    },
    activeProjectChanged: (state, action: PayloadAction<string>) => {
      if (state.projects.some((project) => project.id === action.payload)) {
        state.activeProjectId = action.payload;
      }
    },
    projectDeleted: (state, action: PayloadAction<string>) => {
      if (state.projects.length <= 1) {
        return;
      }

      state.projects = state.projects.filter((project) => project.id !== action.payload);

      if (!state.projects.some((project) => project.id === state.activeProjectId)) {
        state.activeProjectId = state.projects[0]!.id;
      }
    },
    taskCreated: (state, action: PayloadAction<CreateTaskPayload>) =>
      updateActiveBoard(state, (board) => createTaskUseCase(board, action.payload)),
    taskUpdated: (state, action: PayloadAction<UpdateTaskPayload>) =>
      updateActiveBoard(state, (board) => updateTaskUseCase(board, action.payload.taskId, action.payload.input)),
    taskDeleted: (state, action: PayloadAction<string>) =>
      updateActiveBoard(state, (board) => deleteTaskUseCase(board, action.payload)),
    taskMoved: (state, action: PayloadAction<MoveTaskPayload>) =>
      updateActiveBoard(state, (board) =>
        moveTaskUseCase(board, action.payload.taskId, action.payload.targetColumnId, action.payload.targetIndex),
      ),
    taskMovedToAdjacentColumn: (state, action: PayloadAction<MoveTaskToAdjacentColumnPayload>) =>
      updateActiveBoard(state, (board) =>
        moveTaskToAdjacentColumnUseCase(board, action.payload.taskId, action.payload.direction),
      ),
    commentAdded: (state, action: PayloadAction<AddCommentPayload>) =>
      updateActiveBoard(state, (board) => addCommentUseCase(board, action.payload.taskId, action.payload.body)),
    checklistItemAdded: (state, action: PayloadAction<AddChecklistItemPayload>) =>
      updateActiveBoard(state, (board) => addChecklistItemUseCase(board, action.payload.taskId, action.payload.title)),
    checklistItemToggled: (state, action: PayloadAction<ChecklistItemPayload>) =>
      updateActiveBoard(state, (board) =>
        toggleChecklistItemUseCase(board, action.payload.taskId, action.payload.itemId),
      ),
    checklistItemDeleted: (state, action: PayloadAction<ChecklistItemPayload>) =>
      updateActiveBoard(state, (board) =>
        deleteChecklistItemUseCase(board, action.payload.taskId, action.payload.itemId),
      ),
    workspaceImported: (_state, action: PayloadAction<Workspace>) => {
      if (action.payload.projects.length === 0) {
        return createEmptyWorkspace();
      }
      return action.payload;
    },
  },
});

export const {
  activeProjectChanged,
  checklistItemAdded,
  checklistItemDeleted,
  checklistItemToggled,
  commentAdded,
  projectCreated,
  projectDeleted,
  taskCreated,
  taskDeleted,
  taskMoved,
  taskMovedToAdjacentColumn,
  taskUpdated,
  workspaceImported,
} = workspaceSlice.actions;

export const workspaceReducer = workspaceSlice.reducer;

export const selectWorkspace = (state: RootState) => state.workspace;
export const selectProjects = (state: RootState) => state.workspace.projects;
export const selectActiveProject = (state: RootState) =>
  state.workspace.projects.find((project) => project.id === state.workspace.activeProjectId) ??
  state.workspace.projects[0]!;
export const selectBoard = (state: RootState) => selectActiveProject(state).board;
