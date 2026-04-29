import { Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { useAppDispatch } from '../../../app/hooks';
import { priorities, type Priority, type TaskColor } from '../../../domain/board';
import { taskCreated } from '../state/boardSlice';
import { PriorityIcon } from './PriorityIcon';
import { TaskColorPicker } from './TaskColorPicker';
import { formatPriority } from './priorityMeta';

type CreateTaskModalProps = {
  onClose(): void;
};

const initialDraft = {
  title: '',
  description: '',
  priority: 'medium' as Priority,
  color: 'none' as TaskColor,
};

type DraftChecklistItem = {
  id: string;
  title: string;
};

export function CreateTaskModal({ onClose }: CreateTaskModalProps) {
  const dispatch = useAppDispatch();
  const [draft, setDraft] = useState(initialDraft);
  const [checklistItem, setChecklistItem] = useState('');
  const [checklist, setChecklist] = useState<DraftChecklistItem[]>([]);

  const submitTask = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    dispatch(taskCreated({ ...draft, checklist: checklist.map((item) => item.title) }));
    setDraft(initialDraft);
    setChecklist([]);
    onClose();
  };

  const addChecklistItem = () => {
    const item = checklistItem.trim();

    if (!item) {
      return;
    }

    setChecklist((current) => [{ id: crypto.randomUUID(), title: item }, ...current]);
    setChecklistItem('');
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="task-modal task-modal--compact"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-task-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="task-modal__header">
          <h2 id="create-task-title">Add task</h2>
          <button className="icon-button" type="button" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </header>

        <form className="task-modal__form" onSubmit={submitTask}>
          <label>
            <span>Title</span>
            <input
              value={draft.title}
              onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
              placeholder="Prepare roadmap"
              required
              autoFocus
            />
          </label>

          <label>
            <span>Description</span>
            <textarea
              value={draft.description}
              onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
              placeholder="What needs to happen?"
              rows={5}
            />
          </label>

          <label>
            <span>Priority</span>
            <select
              value={draft.priority}
              onChange={(event) =>
                setDraft((current) => ({ ...current, priority: event.target.value as Priority }))
              }
            >
              {priorities.map((priority) => (
                <option value={priority} key={priority}>
                  {formatPriority(priority)}
                </option>
              ))}
            </select>
          </label>

          <div className="priority-preview" aria-hidden="true">
            <PriorityIcon priority={draft.priority} />
            <span>{formatPriority(draft.priority)}</span>
          </div>

          <TaskColorPicker
            value={draft.color}
            onChange={(color) => setDraft((current) => ({ ...current, color }))}
          />

          <section className="checklist checklist--draft" aria-label="Initial checklist">
            <header className="checklist__header">
              <h3>Checklist</h3>
              <span>{checklist.length}</span>
            </header>

            <div className="checklist__form">
              <label>
                <span>Item</span>
                <input
                  value={checklistItem}
                  onChange={(event) => setChecklistItem(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      addChecklistItem();
                    }
                  }}
                  placeholder="Add acceptance criteria"
                />
              </label>
              <button className="secondary-button" type="button" onClick={addChecklistItem} title="Add checklist item">
                <Plus size={18} />
                Add item
              </button>
            </div>

            <div className="checklist__list">
              {checklist.map((item) => (
                <article className="checklist-item" key={item.id}>
                  <span className="checklist-item__draft">{item.title}</span>
                  <button
                    className="icon-button"
                    type="button"
                    onClick={() => setChecklist((current) => current.filter((currentItem) => currentItem.id !== item.id))}
                    title="Delete checklist item"
                  >
                    <Trash2 size={16} />
                  </button>
                </article>
              ))}
              {checklist.length === 0 ? <p className="checklist__empty">No checklist items yet</p> : null}
            </div>
          </section>

          <div className="task-modal__toolbar">
            <button className="secondary-button" type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="primary-button" type="submit">
              Add task
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
