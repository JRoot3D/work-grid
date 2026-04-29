import { AlertTriangle, X } from 'lucide-react';

type ConfirmModalProps = {
  title: string;
  message: string;
  confirmLabel: string;
  onCancel(): void;
  onConfirm(): void;
};

export function ConfirmModal({ title, message, confirmLabel, onCancel, onConfirm }: ConfirmModalProps) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onCancel}>
      <section
        className="confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="confirm-modal__header">
          <span className="confirm-modal__icon" aria-hidden="true">
            <AlertTriangle size={20} />
          </span>
          <h2 id="confirm-title">{title}</h2>
          <button className="icon-button" type="button" onClick={onCancel} title="Close">
            <X size={18} />
          </button>
        </header>

        <p>{message}</p>

        <div className="confirm-modal__actions">
          <button className="secondary-button" type="button" onClick={onCancel}>
            Cancel
          </button>
          <button className="danger-button" type="button" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
