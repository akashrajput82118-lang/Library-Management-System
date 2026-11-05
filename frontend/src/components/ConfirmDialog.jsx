import Modal from './Modal'
import { AlertIcon } from './Icons'

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  busy = false,
  onConfirm,
  onClose
}) {
  return (
    <Modal title={title} onClose={busy ? () => {} : onClose}>
      <div className="confirm-content">
        <div className="confirm-icon">
          <AlertIcon size={26} />
        </div>
        <p>{message}</p>
      </div>
      <div className="form-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onClose}
          disabled={busy}
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          className="btn btn-danger"
          onClick={onConfirm}
          disabled={busy}
        >
          {busy ? <span className="spinner spinner-light" /> : null}
          {busy ? 'Working…' : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
