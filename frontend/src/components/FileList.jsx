import { downloadFile } from '../api.js';

function getFileIcon(mimeType) {
  if (!mimeType) return { className: 'default', emoji: '📄' };
  if (mimeType.startsWith('image/')) return { className: 'image', emoji: '🖼️' };
  if (mimeType === 'application/pdf') return { className: 'pdf', emoji: '📕' };
  if (mimeType.includes('word') || mimeType.includes('document'))
    return { className: 'doc', emoji: '📘' };
  if (mimeType.includes('sheet') || mimeType.includes('excel'))
    return { className: 'doc', emoji: '📊' };
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint'))
    return { className: 'doc', emoji: '📙' };
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z'))
    return { className: 'archive', emoji: '📦' };
  if (mimeType.startsWith('video/')) return { className: 'video', emoji: '🎬' };
  if (mimeType.startsWith('audio/')) return { className: 'audio', emoji: '🎵' };
  return { className: 'default', emoji: '📄' };
}

function formatSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getExtension(filename) {
  const parts = filename.split('.');
  if (parts.length > 1) return parts.pop().toUpperCase();
  return 'FILE';
}

export default function FileList({ files, onDelete, onToast }) {
  const handleDownload = async (file) => {
    try {
      const data = await downloadFile(file.id);
      window.open(data.downloadUrl, '_blank');
    } catch (err) {
      onToast(err.message, 'error');
    }
  };

  const handleDelete = (file) => {
    onDelete(file);
  };

  if (!files || files.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-icon">☁️</span>
        <h3>No files yet</h3>
        <p>Upload your first file to get started</p>
      </div>
    );
  }

  return (
    <div className="files-section">
      <div className="files-header">
        <h3>Your Files</h3>
        <span className="files-count">{files.length} file{files.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="files-grid">
        {files.map((file) => {
          const icon = getFileIcon(file.mime_type);
          return (
            <div className="file-row" key={file.id}>
              <div className={`file-icon ${icon.className}`}>{icon.emoji}</div>
              <div className="file-info">
                <div className="file-name" title={file.original_name}>
                  {file.original_name}
                </div>
                <div className="file-date">{formatDate(file.uploaded_at)}</div>
              </div>
              <span className="file-size">{formatSize(file.file_size)}</span>
              <span className="file-type-badge">{getExtension(file.original_name)}</span>
              <div className="file-actions">
                <button
                  className="btn-ghost"
                  onClick={() => handleDownload(file)}
                  title="Download"
                >
                  ⬇️
                </button>
                <button
                  className="btn-ghost"
                  onClick={() => handleDelete(file)}
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
