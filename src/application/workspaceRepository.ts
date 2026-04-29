import type { Workspace } from '../domain/board';

export interface WorkspaceRepository {
  load(): Workspace;
  save(workspace: Workspace): void;
}
