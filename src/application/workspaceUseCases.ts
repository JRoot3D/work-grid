import type { Workspace } from '../domain/board';
import { parseWorkspace, serializeWorkspace } from '../infrastructure/persistence/workspaceSerializer';

export function exportWorkspaceAsBlob(workspace: Workspace): Blob {
  return new Blob([serializeWorkspace(workspace)], { type: 'application/json' });
}

export function importWorkspaceFromText(text: string): Workspace {
  return parseWorkspace(text);
}
