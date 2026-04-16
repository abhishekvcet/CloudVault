export default function ConfirmModal({ file, onConfirm, onCancel }) {
  if (!file) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h3>Delete file?</h3>
        <p>
          Are you sure you want to delete{' '}
          <strong>{file.original_name}</strong>? This action cannot be undone.
        </p>
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={() => onConfirm(file)}>
            🗑️ Delete
          </button>
        </div>
      </div>
    </div>
  );
}
