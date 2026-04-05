import React, { useRef, useState } from 'react';
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
    <div className="flex flex-col gap-2.5">
      {label && <div className="text-[0.85rem] font-semibold text-gray-700">{label}</div>}
      <div
        className={`border-2 border-dashed rounded-xl py-7 px-5 text-center cursor-pointer transition-all
          ${dragging ? 'border-primary bg-primary-light' : 'border-gray-300 bg-gray-50 hover:border-primary hover:bg-primary-light'}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
      >
        <FaCloudUploadAlt className={`text-[2rem] mb-2 mx-auto transition-colors ${dragging ? 'text-primary' : 'text-gray-400'}`} />
        <div className="text-[0.85rem] text-gray-500">
          Kéo thả hoặc <span className="text-primary font-semibold underline">chọn file</span>
        </div>
        {hint && <div className="text-[0.75rem] text-gray-400 mt-1">{hint}</div>}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="hidden"
          onChange={e => handleFiles(e.target.files)}
        />
      </div>
      {files.length > 0 && (
        <div className="flex flex-col gap-2">
          {files.map(f => (
            <div key={f.id} className="flex items-center gap-2.5 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
              {f.url
                ? <img src={f.url} alt={f.name} className="w-10 h-10 object-cover rounded-md" />
                : <FaCheckCircle className="text-sky-600 text-[1.2rem]" />
              }
              <span className="flex-1 text-[0.8rem] text-gray-700 overflow-hidden text-ellipsis whitespace-nowrap">{f.name}</span>
              <button
                className="text-gray-400 p-1 rounded flex items-center justify-center hover:text-red-600 hover:bg-red-100 transition-colors"
                onClick={() => remove(f.id)}
              >
                <FaTimes />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
