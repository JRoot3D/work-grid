import { Download, Plus, Search, Trash2, Upload } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import type { ColumnId, Task } from '../../../domain/board';
import { exportWorkspaceAsBlob, importWorkspaceFromText } from '../../../application/workspaceUseCases';
import {
  activeProjectChanged,
  projectDeleted,
  selectActiveProject,
  selectBoard,
  selectProjects,
  selectWorkspace,
  taskMoved,
  workspaceImported,
} from '../state/workspaceSlice';
import { ColumnView } from './ColumnView';
import { ConfirmModal } from './ConfirmModal';
import { CreateProjectModal } from './CreateProjectModal';
import { CreateTaskModal } from './CreateTaskModal';
import { TaskModal } from './TaskModal';
import { taskColorLabels } from './taskColorMeta';

const getIssueKey = (task: Task) => `WG-${task.id.slice(0, 4).toUpperCase()}`;

const taskMatchesSearch = (task: Task, query: string) => {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  const searchableText = [
    getIssueKey(task),
    task.title,
    task.description,
    task.priority,
    taskColorLabels[task.color],
    ...task.comments.map((comment) => comment.body),
    ...task.checklist.map((item) => item.title),
  ]
    .join(' ')
    .toLowerCase();

  return searchableText.includes(normalizedQuery);
};

export function BoardPage() {
  const workspace = useAppSelector(selectWorkspace);
  const projects = useAppSelector(selectProjects);
  const activeProject = useAppSelector(selectActiveProject);
  const board = useAppSelector(selectBoard);
  const dispatch = useAppDispatch();
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isDeleteProjectConfirmOpen, setIsDeleteProjectConfirmOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedTask = selectedTaskId ? board.tasks[selectedTaskId] : null;
  const filteredTaskIds = useMemo(() => {
    const matchedIds = new Set<string>();

    Object.values(board.tasks).forEach((task) => {
      if (taskMatchesSearch(task, searchQuery)) {
        matchedIds.add(task.id);
      }
    });

    return matchedIds;
  }, [board.tasks, searchQuery]);
  const hasSearchQuery = searchQuery.trim().length > 0;
  const hasSearchResults = !hasSearchQuery || filteredTaskIds.size > 0;

  const exportData = () => {
    const blob = exportWorkspaceAsBlob(workspace);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = `work-grid-workspace-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      dispatch(workspaceImported(importWorkspaceFromText(await file.text())));
      setSelectedTaskId(null);
      setImportError('');
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Import failed.');
    } finally {
      event.target.value = '';
    }
  };

  const handleDrop = (taskId: string, columnId: ColumnId, targetIndex: number) => {
    dispatch(taskMoved({ taskId, targetColumnId: columnId, targetIndex }));
  };

  const changeProject = (projectId: string) => {
    dispatch(activeProjectChanged(projectId));
    setSelectedTaskId(null);
  };

  const deleteActiveProject = () => {
    dispatch(projectDeleted(activeProject.id));
    setSelectedTaskId(null);
    setIsDeleteProjectConfirmOpen(false);
  };

  return (
    <main className="app-shell">
      <section className="topbar" aria-label="Board actions">
        <div>
          <p className="eyebrow">Projects / {activeProject.name}</p>
          <h1>Board</h1>
        </div>

        <div className="topbar__actions">
          <select
            className="project-select"
            value={activeProject.id}
            onChange={(event) => changeProject(event.target.value)}
            aria-label="Project"
          >
            {projects.map((project) => (
              <option value={project.id} key={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          <button className="secondary-button" type="button" onClick={() => setIsCreateProjectOpen(true)}>
            <Plus size={18} />
            Project
          </button>
          <button
            className="icon-button"
            type="button"
            onClick={() => setIsDeleteProjectConfirmOpen(true)}
            title="Delete project"
            disabled={projects.length <= 1}
          >
            <Trash2 size={18} />
          </button>
          <button className="icon-button" type="button" onClick={exportData} title="Export board">
            <Download size={18} />
          </button>
          <button className="icon-button" type="button" onClick={() => fileInputRef.current?.click()} title="Import board">
            <Upload size={18} />
          </button>
          <input ref={fileInputRef} type="file" accept="application/json,.json" onChange={importData} hidden />
        </div>
      </section>

      {importError ? <p className="alert">{importError}</p> : null}

      <section className="board-toolbar" aria-label="Create task">
        <label className="search-box" aria-label="Search tasks">
          <Search size={18} />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search"
          />
        </label>
        <button className="primary-button" type="button" onClick={() => setIsCreateTaskOpen(true)}>
          <Plus size={18} />
          Add task
        </button>
      </section>

      {!hasSearchResults ? <p className="search-empty">No tasks match this search.</p> : null}

      <section className="board" aria-label="Kanban board">
        {board.columns.map((column) => (
          <ColumnView
            key={column.id}
            column={column}
            tasks={column.taskIds.flatMap((taskId) => {
              const task = board.tasks[taskId];
              return task && filteredTaskIds.has(task.id) ? [task] : [];
            })}
            onDropTask={handleDrop}
            onOpenTask={setSelectedTaskId}
          />
        ))}
      </section>

      {isCreateTaskOpen ? <CreateTaskModal onClose={() => setIsCreateTaskOpen(false)} /> : null}
      {isCreateProjectOpen ? <CreateProjectModal onClose={() => setIsCreateProjectOpen(false)} /> : null}
      {isDeleteProjectConfirmOpen ? (
        <ConfirmModal
          title="Delete project?"
          message={`"${activeProject.name}" and all tasks on its board will be permanently removed.`}
          confirmLabel="Delete project"
          onCancel={() => setIsDeleteProjectConfirmOpen(false)}
          onConfirm={deleteActiveProject}
        />
      ) : null}
      {selectedTask ? <TaskModal task={selectedTask} onClose={() => setSelectedTaskId(null)} /> : null}
    </main>
  );
}
