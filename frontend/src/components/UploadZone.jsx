import { useRef, useState } from 'react';

export default function UploadZone({ onUpload, disabled }) {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files[0]);
      e.target.value = '';
    }
  };

  return (
    <div
      className={`upload-zone ${dragActive ? 'drag-active' : ''}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      style={disabled ? { opacity: 0.5, pointerEvents: 'none' } : {}}
    >
      <div className="upload-zone-content">
        <span className="upload-icon">📁</span>
        <h3>
          {dragActive ? 'Drop your file here' : 'Drag & drop a file here'}
        </h3>
        <p>
          or <span className="browse-text">browse</span> to choose a file
        </p>
        <p style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}>
          Max 50MB · Images, Documents, Archives, Media
        </p>
      </div>
      <input
        ref={inputRef}
        id="file-upload-input"
        type="file"
        onChange={handleChange}
        style={{ display: 'none' }}
      />
    </div>
  );
}
