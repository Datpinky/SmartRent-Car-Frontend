import React, { useRef, useState } from 'react';
import './FileUpload.css';
import { FaCloudUploadAlt, FaTimes, FaCheckCircle } from 'react-icons/fa';

const FileUpload = ({ label, accept = 'image/*', multiple = false, onUpload, hint, preview = true }) => {
  const [files, setFiles] = useState([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();

  const handleFiles = (newFiles) => {
    const arr = Array.from(newFiles);
    const withPrev = arr.map(f => ({
      file: f,
      id: Math.random().toString(36).slice(2),
      url: preview && f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
      name: f.name,
    }));
    const updated = multiple ? [...files, ...withPrev] : withPrev;
    setFiles(updated);
    if (onUpload) onUpload(updated.map(f => f.file));
  };

  const remove = (id) => {
    const updated = files.filter(f => f.id !== id);
    setFiles(updated);
    if (onUpload) onUpload(updated.map(f => f.file));
  };

  return (
    <div className="file-upload">
      {label && <div className="fu-label">{label}</div>}
      <div
        className={`fu-zone ${dragging ? 'dragging' : ''}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
      >
        <FaCloudUploadAlt className="fu-icon" />
        <div className="fu-text">Kéo thả hoặc <span>chọn file</span></div>
        {hint && <div className="fu-hint">{hint}</div>}
        <input ref={inputRef} type="file" accept={accept} multiple={multiple} style={{ display: 'none' }}
          onChange={e => handleFiles(e.target.files)} />
      </div>
      {files.length > 0 && (
        <div className="fu-files">
          {files.map(f => (
            <div key={f.id} className="fu-file-item">
              {f.url
                ? <img src={f.url} alt={f.name} className="fu-preview-img" />
                : <FaCheckCircle style={{ color: '#059669', fontSize: '1.2rem' }} />
              }
              <span className="fu-file-name">{f.name}</span>
              <button className="fu-remove" onClick={() => remove(f.id)}><FaTimes /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
