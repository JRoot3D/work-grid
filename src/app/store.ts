import { configureStore } from '@reduxjs/toolkit';
import { createLocalWorkspaceRepository } from '../infrastructure/persistence/localWorkspaceRepository';
import { workspaceReducer } from '../features/board/state/workspaceSlice';

const workspaceRepository = createLocalWorkspaceRepository();

export const store = configureStore({
  reducer: {
    workspace: workspaceReducer,
  },
  preloadedState: {
    workspace: workspaceRepository.load(),
  },
});

store.subscribe(() => {
  workspaceRepository.save(store.getState().workspace);
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
