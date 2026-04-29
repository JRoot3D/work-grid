import { createEmptyWorkspace, createProject, type Project, type Workspace } from '../../domain/board';
import { parseBoard, serializeBoard } from './boardSerializer';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const normalizeProject = (value: unknown): Project | null => {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    typeof value.name !== 'string' ||
    typeof value.createdAt !== 'string'
  ) {
    return null;
  }

  try {
    return {
      id: value.id,
      name: value.name.trim() || 'Untitled project',
      createdAt: value.createdAt,
      board: parseBoard(JSON.stringify(value.board)),
    };
  } catch {
    return null;
  }
};

export function serializeWorkspace(workspace: Workspace): string {
  return JSON.stringify(workspace, null, 2);
}

export function parseWorkspace(json: string): Workspace {
  const parsed: unknown = JSON.parse(json);

  if (isRecord(parsed) && parsed.schemaVersion === 2 && Array.isArray(parsed.projects)) {
    const projects = parsed.projects.flatMap((project) => {
      const normalizedProject = normalizeProject(project);
      return normalizedProject ? [normalizedProject] : [];
    });

    if (projects.length === 0) {
      throw new Error('Workspace has no valid projects.');
    }

    const activeProjectId =
      typeof parsed.activeProjectId === 'string' && projects.some((project) => project.id === parsed.activeProjectId)
        ? parsed.activeProjectId
        : projects[0]!.id;

    return {
      schemaVersion: 2,
      activeProjectId,
      projects,
    };
  }

  const importedBoard = parseBoard(json);
  const project = createProject('Imported project', importedBoard);

  return {
    schemaVersion: 2,
    activeProjectId: project.id,
    projects: [project],
  };
}

export function workspaceFromLegacyBoardJson(json: string): Workspace {
  const project = createProject('Work Grid', parseBoard(json));

  return {
    schemaVersion: 2,
    activeProjectId: project.id,
    projects: [project],
  };
}

export function exportBoardFromWorkspace(workspace: Workspace) {
  const project = workspace.projects.find((item) => item.id === workspace.activeProjectId) ?? workspace.projects[0];
  return project ? serializeBoard(project.board) : serializeBoard(createEmptyWorkspace().projects[0]!.board);
}
