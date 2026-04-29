import { X } from 'lucide-react';
import { useState } from 'react';
import { useAppDispatch } from '../../../app/hooks';
import { projectCreated } from '../state/boardSlice';

type CreateProjectModalProps = {
  onClose(): void;
};

export function CreateProjectModal({ onClose }: CreateProjectModalProps) {
  const dispatch = useAppDispatch();
  const [projectName, setProjectName] = useState('');

  const createProject = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    dispatch(projectCreated({ name: projectName }));
    setProjectName('');
    onClose();
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="task-modal task-modal--compact"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-project-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="task-modal__header">
          <h2 id="create-project-title">Create project</h2>
          <button className="icon-button" type="button" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </header>

        <form className="task-modal__form" onSubmit={createProject}>
          <label>
            <span>Project name</span>
            <input
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
              placeholder="Mobile app"
              required
              autoFocus
            />
          </label>

          <div className="task-modal__toolbar">
            <button className="secondary-button" type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="primary-button" type="submit">
              Create project
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
