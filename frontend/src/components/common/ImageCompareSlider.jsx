import React, { useState, useRef, useCallback } from 'react';
import './ImageCompareSlider.css';
import { FaArrowsAltH } from 'react-icons/fa';
import { MdWarning } from 'react-icons/md';

const ImageCompareSlider = ({ beforeSrc, afterSrc, damages = [], onDamageClick }) => {
  const [position, setPosition] = useState(50);
  const [dragging, setDragging] = useState(false);
  const [selectedDamage, setSelectedDamage] = useState(null);
  const containerRef = useRef();

  const updatePosition = useCallback((clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setPosition(x);
  }, []);

  const onMouseDown = (e) => { setDragging(true); e.preventDefault(); };
  const onMouseMove = useCallback((e) => { if (dragging) updatePosition(e.clientX); }, [dragging, updatePosition]);
  const onMouseUp = useCallback(() => setDragging(false), []);
  const onTouchMove = useCallback((e) => { if (dragging) updatePosition(e.touches[0].clientX); }, [dragging, updatePosition]);

  const handleDamageClick = (dmg, e) => {
    e.stopPropagation();
    setSelectedDamage(selectedDamage?.id === dmg.id ? null : dmg);
    if (onDamageClick) onDamageClick(dmg);
  };

  return (
    <div className="ics-wrap">
      <div
        ref={containerRef}
        className="ics-container"
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onTouchMove={onTouchMove}
        onTouchEnd={onMouseUp}
      >
        {/* Before image */}
        <div className="ics-before">
          {beforeSrc ? <img src={beforeSrc} alt="Trước" /> : <div className="ics-placeholder">Ảnh trước thuê</div>}
          <div className="ics-label ics-label-left">TRƯỚC</div>
        </div>

        {/* After image (clipped) */}
        <div className="ics-after" style={{ clipPath: `inset(0 0 0 ${position}%)` }}>
          {afterSrc ? <img src={afterSrc} alt="Sau" /> : <div className="ics-placeholder">Ảnh sau thuê</div>}
          <div className="ics-label ics-label-right">SAU</div>
          {/* Damage overlays */}
          {damages.map(dmg => (
            <div
              key={dmg.id}
              className={`ics-damage ${selectedDamage?.id === dmg.id ? 'selected' : ''}`}
              style={{ left: `${dmg.x}%`, top: `${dmg.y}%`, width: `${dmg.w || 8}%`, height: `${dmg.h || 8}%` }}
              onClick={(e) => handleDamageClick(dmg, e)}
            >
              <MdWarning className="ics-damage-icon" />
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="ics-divider" style={{ left: `${position}%` }}>
          <div className="ics-handle" onMouseDown={onMouseDown} onTouchStart={onMouseDown}>
            <FaArrowsAltH />
          </div>
        </div>
      </div>

      {/* Damage detail popup */}
      {selectedDamage && (
        <div className="ics-damage-detail">
          <div className="ics-dd-header">
            <MdWarning style={{ color: '#d97706' }} />
            <span>{selectedDamage.label || 'Hư hỏng được phát hiện'}</span>
            <button onClick={() => setSelectedDamage(null)} className="ics-dd-close">×</button>
          </div>
          <div className="ics-dd-body">
            <div><b>Vị trí:</b> {selectedDamage.location || 'Xem trên ảnh'}</div>
            <div><b>Mức độ:</b> <span style={{ color: selectedDamage.severity === 'high' ? '#dc2626' : selectedDamage.severity === 'medium' ? '#d97706' : '#059669' }}>{selectedDamage.severityLabel || selectedDamage.severity || 'Nhẹ'}</span></div>
            {selectedDamage.description && <div><b>Mô tả:</b> {selectedDamage.description}</div>}
            {selectedDamage.cost && <div><b>Chi phí dự kiến:</b> {selectedDamage.cost}</div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageCompareSlider;
