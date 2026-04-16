import { useState, useEffect, useCallback } from 'react';
import AuthPage from './components/AuthPage.jsx';
import Navbar from './components/Navbar.jsx';
import UploadZone from './components/UploadZone.jsx';
import FileList from './components/FileList.jsx';
import Toast from './components/Toast.jsx';
import ConfirmModal from './components/ConfirmModal.jsx';
import { uploadFile, listFiles, deleteFile, verifyToken } from './api.js';

function formatSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function App() {
  const [user, setUser] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadFileName, setUploadFileName] = useState('');
  const [toasts, setToasts] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Toast helper
  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Check for existing session
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('cv_token');
      const storedUser = localStorage.getItem('cv_user');
      if (token && storedUser) {
        try {
          await verifyToken();
          setUser(JSON.parse(storedUser));
        } catch {
          localStorage.removeItem('cv_token');
          localStorage.removeItem('cv_user');
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  // Load files when user is set
  useEffect(() => {
    if (user) {
      loadFiles();
    }
  }, [user]);

  const loadFiles = async () => {
    try {
      const data = await listFiles();
      setFiles(data.files || []);
    } catch (err) {
      addToast('Failed to load files: ' + err.message, 'error');
    }
  };

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('cv_token');
    localStorage.removeItem('cv_user');
    setUser(null);
    setFiles([]);
  };

  const handleUpload = async (file) => {
    if (uploading) return;

    // File size check (50MB)
    if (file.size > 50 * 1024 * 1024) {
      addToast('File is too large. Maximum size is 50MB.', 'error');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadFileName(file.name);

    try {
      await uploadFile(file, (progress) => {
        setUploadProgress(progress);
      });
      addToast(`"${file.name}" uploaded successfully!`, 'success');
      await loadFiles();
    } catch (err) {
      addToast('Upload failed: ' + err.message, 'error');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setUploadFileName('');
    }
  };

  const handleDeleteConfirm = async (file) => {
    setDeleteTarget(null);
    try {
      await deleteFile(file.id);
      addToast(`"${file.original_name}" deleted`, 'success');
      setFiles((prev) => prev.filter((f) => f.id !== file.id));
    } catch (err) {
      addToast('Delete failed: ' + err.message, 'error');
    }
  };

  // Computed stats
  const totalSize = files.reduce((sum, f) => sum + (f.file_size || 0), 0);
  const recentCount = files.filter((f) => {
    const d = new Date(f.uploaded_at);
    const now = new Date();
    return now - d < 7 * 24 * 60 * 60 * 1000;
  }).length;

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Toast toasts={toasts} removeToast={removeToast} />
        <AuthPage onLogin={handleLogin} />
      </>
    );
  }

  return (
    <>
      <Toast toasts={toasts} removeToast={removeToast} />
      <ConfirmModal
        file={deleteTarget}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

      <Navbar user={user} onLogout={handleLogout} />

      <main className="dashboard">
        <div className="dashboard-header">
          <h2>Dashboard</h2>
          <button className="btn btn-primary" onClick={() => document.getElementById('file-upload-input')?.click()}>
            ⬆️ Upload File
          </button>
        </div>

        {/* Stats */}
        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-icon files">📁</div>
            <div>
              <div className="stat-value">{files.length}</div>
              <div className="stat-label">Total Files</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon storage">💾</div>
            <div>
              <div className="stat-value">{formatSize(totalSize)}</div>
              <div className="stat-label">Storage Used</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon recent">🕐</div>
            <div>
              <div className="stat-value">{recentCount}</div>
              <div className="stat-label">This Week</div>
            </div>
          </div>
        </div>

        {/* Upload Zone */}
        <UploadZone onUpload={handleUpload} disabled={uploading} />

        {/* Upload Progress */}
        {uploading && (
          <div className="upload-progress">
            <div className="upload-progress-header">
              <span className="upload-progress-name">{uploadFileName}</span>
              <span className="upload-progress-percent">{uploadProgress}%</span>
            </div>
            <div className="progress-bar-bg">
              <div
                className="progress-bar-fill"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* File List */}
        <FileList
          files={files}
          onDelete={(file) => setDeleteTarget(file)}
          onToast={addToast}
        />
      </main>
    </>
  );
}
