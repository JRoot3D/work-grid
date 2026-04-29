import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import { useAppDispatch } from '../../../app/hooks';
import { priorities, type Priority, type Task } from '../../../domain/board';
import {
  checklistItemAdded,
  checklistItemDeleted,
  checklistItemToggled,
  commentAdded,
  taskDeleted,
  taskMovedToAdjacentColumn,
  taskUpdated,
} from '../state/boardSlice';
import { ConfirmModal } from './ConfirmModal';
import { PriorityIcon } from './PriorityIcon';
import { TaskColorPicker } from './TaskColorPicker';
import { formatPriority } from './priorityMeta';
import { taskColorLabels } from './taskColorMeta';

type TaskModalProps = {
  task: Task;
  onClose(): void;
};

export function TaskModal({ task, onClose }: TaskModalProps) {
  const dispatch = useAppDispatch();
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [priority, setPriority] = useState(task.priority);
  const [color, setColor] = useState(task.color);
  const [checklistItem, setChecklistItem] = useState('');
  const [comment, setComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const completedChecklistItems = task.checklist.filter((item) => item.completed).length;

  const saveTask = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    dispatch(taskUpdated({ taskId: task.id, input: { title, description, priority, color } }));
    setIsEditing(false);
  };

  const submitComment = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    dispatch(commentAdded({ taskId: task.id, body: comment }));
    setComment('');
  };

  const submitChecklistItem = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    dispatch(checklistItemAdded({ taskId: task.id, title: checklistItem }));
    setChecklistItem('');
  };

  const deleteTask = () => {
    dispatch(taskDeleted(task.id));
    onClose();
  };

  const cancelEditing = () => {
    setTitle(task.title);
    setDescription(task.description);
    setPriority(task.priority);
    setColor(task.color);
    setIsEditing(false);
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="task-modal" role="dialog" aria-modal="true" aria-labelledby="task-title" onMouseDown={(event) => event.stopPropagation()}>
        <header className="task-modal__header">
          <h2 id="task-title">{isEditing ? 'Edit task' : task.title}</h2>
          <button className="icon-button" type="button" onClick={onClose} title="Close">
            <X size={18} />
          </button>
        </header>

        {isEditing ? (
          <form className="task-modal__form" onSubmit={saveTask}>
            <label>
              <span>Title</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} required />
            </label>

            <label>
              <span>Description</span>
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={5} />
            </label>

            <label>
              <span>Priority</span>
              <select value={priority} onChange={(event) => setPriority(event.target.value as Priority)}>
                {priorities.map((item) => (
                  <option value={item} key={item}>
                    {formatPriority(item)}
                  </option>
                ))}
              </select>
            </label>

            <div className="priority-preview" aria-hidden="true">
              <PriorityIcon priority={priority} />
              <span>{formatPriority(priority)}</span>
            </div>

            <TaskColorPicker value={color} onChange={setColor} />

            <div className="task-modal__toolbar">
              <button className="secondary-button" type="button" onClick={cancelEditing}>Cancel</button>
              <button className="primary-button" type="submit">Save</button>
            </div>
          </form>
        ) : (
          <section className="task-view" aria-label="Task details">
            <div className="task-view__meta">
              <span className="task-view__priority">
                <PriorityIcon priority={task.priority} />
                {formatPriority(task.priority)}
              </span>
              <span className={`task-view__color task-view__color--${task.color}`}>
                {taskColorLabels[task.color]}
              </span>
            </div>

            <div className="task-view__field">
              <h3>Description</h3>
              {task.description ? <p>{task.description}</p> : <p className="task-view__empty">No description</p>}
            </div>

            <div className="task-modal__toolbar">
              <button className="secondary-button" type="button" onClick={() => setIsEditing(true)}>
                <Pencil size={18} />
                Edit
              </button>
              <button className="secondary-button" type="button" onClick={() => dispatch(taskMovedToAdjacentColumn({ taskId: task.id, direction: -1 }))} title="Move left">
                <ChevronLeft size={18} />
              </button>
              <button className="secondary-button" type="button" onClick={() => dispatch(taskMovedToAdjacentColumn({ taskId: task.id, direction: 1 }))} title="Move right">
                <ChevronRight size={18} />
              </button>
              <button className="danger-button" type="button" onClick={() => setIsDeleteConfirmOpen(true)} title="Delete task">
                <Trash2 size={18} />
              </button>
            </div>
          </section>
        )}

        <section className="checklist" aria-label="Checklist">
          <header className="checklist__header">
            <h3>Checklist</h3>
            <span>
              {completedChecklistItems}/{task.checklist.length}
            </span>
          </header>

          {isEditing ? (
            <form className="checklist__form" onSubmit={submitChecklistItem}>
              <label>
                <span>Item</span>
                <input
                  value={checklistItem}
                  onChange={(event) => setChecklistItem(event.target.value)}
                  placeholder="Add acceptance criteria"
                />
              </label>
              <button className="secondary-button" type="submit" title="Add checklist item">
                <Plus size={18} />
                Add item
              </button>
            </form>
          ) : null}

          <div className="checklist__list">
            {task.checklist.map((item) => (
              <article className={`checklist-item ${isEditing ? '' : 'checklist-item--view'}`} key={item.id}>
                <label className="checklist-item__label">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => dispatch(checklistItemToggled({ taskId: task.id, itemId: item.id }))}
                  />
                  <span>{item.title}</span>
                </label>
                {isEditing ? (
                  <button
                    className="icon-button"
                    type="button"
                    onClick={() => dispatch(checklistItemDeleted({ taskId: task.id, itemId: item.id }))}
                    title="Delete checklist item"
                  >
                    <Trash2 size={16} />
                  </button>
                ) : null}
              </article>
            ))}
            {task.checklist.length === 0 ? <p className="checklist__empty">No checklist items yet</p> : null}
          </div>
        </section>

        <section className="comments" aria-label="Comments">
          <form className="comments__form" onSubmit={submitComment}>
            <label>
              <span>Comment</span>
              <textarea value={comment} onChange={(event) => setComment(event.target.value)} rows={3} />
            </label>
            <button className="secondary-button" type="submit">Add comment</button>
          </form>

          <div className="comments__list">
            {task.comments.map((item) => (
              <article className="comment" key={item.id}>
                <p>{item.body}</p>
                <time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString()}</time>
              </article>
            ))}
            {task.comments.length === 0 ? <p className="comments__empty">No comments yet</p> : null}
          </div>
        </section>
      </section>
      {isDeleteConfirmOpen ? (
        <ConfirmModal
          title="Delete task?"
          message={`"${task.title}" will be permanently removed from this board.`}
          confirmLabel="Delete task"
          onCancel={() => setIsDeleteConfirmOpen(false)}
          onConfirm={deleteTask}
        />
      ) : null}
    </div>
  );
}
