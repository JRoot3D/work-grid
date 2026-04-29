import type { WorkspaceRepository } from '../../application/workspaceRepository';
import { createEmptyWorkspace } from '../../domain/board';
import { parseWorkspace, serializeWorkspace, workspaceFromLegacyBoardJson } from './workspaceSerializer';

const workspaceStorageKey = 'work-grid-workspace';
const legacyBoardStorageKey = 'work-grid-board';

export function createLocalWorkspaceRepository(): WorkspaceRepository {
  return {
    load() {
      const storedWorkspace = localStorage.getItem(workspaceStorageKey);

      if (storedWorkspace) {
        try {
          return parseWorkspace(storedWorkspace);
        } catch {
          return createEmptyWorkspace();
        }
      }

      const legacyBoard = localStorage.getItem(legacyBoardStorageKey);

      if (legacyBoard) {
        try {
          return workspaceFromLegacyBoardJson(legacyBoard);
        } catch {
          return createEmptyWorkspace();
        }
      }

      return createEmptyWorkspace();
    },
    save(workspace) {
      localStorage.setItem(workspaceStorageKey, serializeWorkspace(workspace));
    },
  };
}
