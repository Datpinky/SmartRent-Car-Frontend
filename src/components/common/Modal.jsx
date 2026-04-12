import React, { useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';

const Modal = ({ isOpen, onClose, title, children, width = 520, footer }) => {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/45 flex items-center justify-center z-[9000] p-4 animate-[modalFade_0.15s_ease]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full shadow-[0_20px_60px_rgba(0,0,0,0.25)] animate-[modalUp_0.2s_ease] max-h-[90vh] flex flex-col"
        style={{ maxWidth: width }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-[18px] border-b border-[#f0f0f0] shrink-0">
          <h3 className="text-base font-bold text-gray-900 m-0">{title}</h3>
          <button
            className="w-8 h-8 border-none bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 text-[0.85rem] transition-colors hover:bg-gray-200 hover:text-gray-900"
            onClick={onClose}
          >
            <FaTimes />
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto flex-1">{children}</div>
        {footer && (
          <div className="px-6 py-3.5 border-t border-[#f0f0f0] flex gap-2.5 justify-end shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
