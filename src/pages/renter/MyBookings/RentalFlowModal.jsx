import React, { useEffect, useMemo, useState } from 'react';
import {
  FaCalendarAlt,
  FaCheckCircle,
  FaClipboardCheck,
  FaMapMarkerAlt,
  FaStore,
} from 'react-icons/fa';
import Modal from '../../../components/common/Modal';
import FileUpload from '../../../components/common/FileUpload';
import StatusBadge from '../../../components/common/StatusBadge';
import uploadService from '../../../services/uploadService';
import { getRentalWorkflow, saveRentalWorkflow } from '../../../utils/rentalWorkflowStorage';

const FLOW_STEPS = [
  { status: 'waiting_handover', label: 'Cho ban giao' },
  { status: 'handed_over', label: 'Da ban giao' },
  { status: 'in_use', label: 'Dang su dung' },
  { status: 'waiting_return_confirmation', label: 'Cho xac nhan tra' },
  { status: 'completed', label: 'Hoan thanh' },
];

const RECEIVE_FIELDS = [
  { key: 'exterior', label: 'Ngoai that khong co va cham bat thuong' },
  { key: 'interior', label: 'Noi that sach se, du phu kien' },
  { key: 'documents', label: 'Da nhan giay to va huong dan xe' },
  { key: 'fuelLevel', label: 'Muc nhien lieu / pin dung nhu ban giao' },
];

const RETURN_FIELDS = [
  { key: 'belongings', label: 'Da lay het do ca nhan ra khoi xe' },
  { key: 'cleanliness', label: 'Tinh trang ve sinh da duoc kiem tra' },
  { key: 'damagesChecked', label: 'Da doi chieu vet tray xuoc / hu hong' },
  { key: 'fuelLevel', label: 'Da ghi nhan lai muc nhien lieu / pin' },
];

const getCurrentStepIndex = (status) => {
  const index = FLOW_STEPS.findIndex((step) => step.status === status);
  return index === -1 ? 0 : index;
};

const dedupeUrls = (urls) => Array.from(new Set((urls || []).filter(Boolean)));

const RentalFlowModal = ({ isOpen, onClose, booking, onSaved }) => {
  const [workflow, setWorkflow] = useState(() => getRentalWorkflow(booking?.id));
  const [receiveFiles, setReceiveFiles] = useState([]);
  const [returnFiles, setReturnFiles] = useState([]);
  const [savingSection, setSavingSection] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !booking?.id) {
      return;
    }

    setWorkflow(getRentalWorkflow(booking.id));
    setReceiveFiles([]);
    setReturnFiles([]);
    setSavingSection('');
    setNotice('');
    setError('');
  }, [booking?.id, isOpen]);

  const currentStepIndex = useMemo(
    () => getCurrentStepIndex(booking?.status),
    [booking?.status]
  );

  const canHandleReceive = ['waiting_handover', 'handed_over', 'in_use', 'waiting_return_confirmation', 'completed'].includes(booking?.status);
  const canHandleReturn = ['in_use', 'waiting_return_confirmation', 'completed'].includes(booking?.status);

  const toggleChecklist = (section, key) => {
    setWorkflow((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [key]: !current[section][key],
      },
    }));
  };

  const handleSaveSection = async (section) => {
    if (!booking?.id) {
      return;
    }

    const isReceive = section === 'receive';
    const selectedFiles = isReceive ? receiveFiles : returnFiles;
    const imageKey = isReceive ? 'receiveImages' : 'returnImages';
    const checklistKey = isReceive ? 'receiveChecklist' : 'returnChecklist';
    const noteKey = isReceive ? 'receiveNote' : 'returnNote';

    setSavingSection(section);
    setError('');
    setNotice('');

    try {
      let uploadedUrls = [];
      if (selectedFiles.length > 0) {
        const results = await uploadService.uploadImages(selectedFiles);
        uploadedUrls = results.map((item) => item.url).filter(Boolean);
      }

      const saved = saveRentalWorkflow(booking.id, {
        [checklistKey]: workflow[checklistKey],
        [noteKey]: workflow[noteKey],
        [imageKey]: dedupeUrls([...(workflow[imageKey] || []), ...uploadedUrls]),
      });

      setWorkflow(saved);
      if (isReceive) {
        setReceiveFiles([]);
      } else {
        setReturnFiles([]);
      }

      setNotice(
        isReceive
          ? 'Da luu bien ban nhan xe trong frontend va cac link anh da upload.'
          : 'Da luu bien ban tra xe trong frontend va cac link anh da upload.'
      );

      if (onSaved) {
        onSaved(saved);
      }
    } catch (err) {
      setError(err.message || 'Khong the luu bien ban cho booking nay.');
    } finally {
      setSavingSection('');
    }
  };

  const renderChecklist = (title, fields, sectionKey, noteKey, imageKey, filesSetter, files, saveKey) => (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <FaClipboardCheck style={{ color: '#00b14f' }} />
        <div style={{ fontWeight: 800, color: '#111827' }}>{title}</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
        {fields.map((field) => (
          <label
            key={field.key}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 12px',
              borderRadius: 12,
              border: '1px solid #e5e7eb',
              background: workflow[sectionKey][field.key] ? '#f0fdf4' : '#fff',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={Boolean(workflow[sectionKey][field.key])}
              onChange={() => toggleChecklist(sectionKey, field.key)}
              style={{ accentColor: '#00b14f', width: 16, height: 16 }}
            />
            <span style={{ fontSize: '0.84rem', color: '#374151', fontWeight: 500 }}>{field.label}</span>
          </label>
        ))}
      </div>

      <div style={{ marginBottom: 14 }}>
        <label className="form-label">Ghi chu</label>
        <textarea
          rows={3}
          value={workflow[noteKey]}
          onChange={(event) =>
            setWorkflow((current) => ({
              ...current,
              [noteKey]: event.target.value,
            }))
          }
          placeholder="Ghi lai tinh trang xe, vat dung di kem, trao doi voi showroom..."
          style={{
            width: '100%',
            border: '1px solid #d1d5db',
            borderRadius: 12,
            padding: '10px 12px',
            fontSize: '0.84rem',
            resize: 'vertical',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <div style={{ marginBottom: 14 }}>
        <FileUpload
          label="Anh doi chieu"
          hint="Anh nay duoc upload len storage, sau do frontend luu link theo booking trong localStorage."
          multiple
          autoUpload={false}
          onFiles={filesSetter}
        />
      </div>

      {Array.isArray(workflow[imageKey]) && workflow[imageKey].length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6b7280', marginBottom: 8 }}>
            Anh da luu
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 10 }}>
            {workflow[imageKey].map((url) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noreferrer"
                style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e7eb', background: '#f9fafb' }}
              >
                <img src={url} alt="Rental evidence" style={{ width: '100%', height: 88, objectFit: 'cover' }} />
              </a>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ fontSize: '0.76rem', color: '#6b7280' }}>
          {files.length > 0 ? `${files.length} file dang cho luu.` : 'Co the luu checklist ma khong can chon them anh.'}
        </div>
        <button
          type="button"
          className="btn-primary"
          onClick={() => handleSaveSection(saveKey)}
          disabled={savingSection === saveKey}
        >
          {savingSection === saveKey ? 'Dang luu...' : 'Luu bien ban'}
        </button>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Quy trinh nhan / tra xe - ${booking?.vehicleName || ''}`}
      width={920}
    >
      {booking && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            style={{
              background: '#fff7ed',
              border: '1px solid #fdba74',
              borderRadius: 14,
              padding: 14,
              color: '#9a3412',
              fontSize: '0.82rem',
              lineHeight: 1.6,
            }}
          >
            Backend hien chi cho showroom cap nhat status booking. Quy trinh duoi day giup renter luu checklist va bang chung
            trong frontend/browser; trang thai booking van doc tu backend.
          </div>

          <div style={{ background: '#f9fafb', borderRadius: 16, padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: '#111827' }}>{booking.vehicleName}</div>
                <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: 4, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <FaStore size={11} /> {booking.showroomName}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <FaCalendarAlt size={11} /> {booking.startDate} -> {booking.endDate}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <FaMapMarkerAlt size={11} /> {booking.locationLabel}
                  </span>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <StatusBadge status={booking.status} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 10 }}>
              {FLOW_STEPS.map((step, index) => {
                const isDone = index < currentStepIndex;
                const isCurrent = index === currentStepIndex;

                return (
                  <div
                    key={step.status}
                    style={{
                      borderRadius: 14,
                      padding: '12px 10px',
                      border: `1px solid ${isCurrent ? '#86efac' : '#e5e7eb'}`,
                      background: isCurrent ? '#f0fdf4' : isDone ? '#f9fafb' : '#fff',
                      textAlign: 'center',
                    }}
                  >
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        margin: '0 auto 8px',
                        borderRadius: '50%',
                        background: isCurrent ? '#00b14f' : isDone ? '#d1fae5' : '#f3f4f6',
                        color: isCurrent ? '#fff' : isDone ? '#059669' : '#9ca3af',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.82rem',
                        fontWeight: 800,
                      }}
                    >
                      {isDone ? <FaCheckCircle /> : index + 1}
                    </div>
                    <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#374151' }}>{step.label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: 12, padding: '12px 14px', fontSize: '0.82rem' }}>
              {error}
            </div>
          )}

          {notice && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', borderRadius: 12, padding: '12px 14px', fontSize: '0.82rem' }}>
              {notice}
            </div>
          )}

          {canHandleReceive && renderChecklist(
            'Bien ban nhan xe',
            RECEIVE_FIELDS,
            'receiveChecklist',
            'receiveNote',
            'receiveImages',
            setReceiveFiles,
            receiveFiles,
            'receive'
          )}

          {canHandleReturn && renderChecklist(
            'Bien ban tra xe',
            RETURN_FIELDS,
            'returnChecklist',
            'returnNote',
            'returnImages',
            setReturnFiles,
            returnFiles,
            'return'
          )}

          {!canHandleReceive && !canHandleReturn && (
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 18, color: '#6b7280', fontSize: '0.84rem' }}>
              Booking nay chua den giai doan nhan / tra xe. Khi backend chuyen sang trang thai ban giao hoac dang su dung,
              renter se thay quy trinh checklist tuong ung tai day.
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default RentalFlowModal;
