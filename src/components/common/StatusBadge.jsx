import React from 'react';

const STATUS_CONFIG = {
  pending: { label: 'Dang cho', bg: '#fef3c7', color: '#d97706' },
  approved: { label: 'Da duyet', bg: '#d1fae5', color: '#059669' },
  confirmed: { label: 'Da xac nhan', bg: '#dcfce7', color: '#15803d' },
  rejected: { label: 'Tu choi', bg: '#fee2e2', color: '#dc2626' },
  active: { label: 'Dang thue', bg: '#dbeafe', color: '#2563eb' },
  in_use: { label: 'Dang su dung', bg: '#dbeafe', color: '#2563eb' },
  available: { label: 'San sang', bg: '#d1fae5', color: '#059669' },
  maintenance: { label: 'Bao duong', bg: '#f3e8ff', color: '#7c3aed' },
  completed: { label: 'Hoan thanh', bg: '#d1fae5', color: '#059669' },
  cancelled: { label: 'Da huy', bg: '#f3f4f6', color: '#6b7280' },
  verified: { label: 'Da xac minh', bg: '#d1fae5', color: '#059669' },
  unverified: { label: 'Chua xac minh', bg: '#fef3c7', color: '#d97706' },
  locked: { label: 'Bi khoa', bg: '#fee2e2', color: '#dc2626' },
  processing: { label: 'Dang xu ly', bg: '#dbeafe', color: '#2563eb' },
  paid: { label: 'Da thanh toan', bg: '#d1fae5', color: '#059669' },
  waiting_payment: { label: 'Cho thanh toan', bg: '#fef3c7', color: '#ca8a04' },
  waiting_handover: { label: 'Cho ban giao', bg: '#ede9fe', color: '#6d28d9' },
  handed_over: { label: 'Da ban giao', bg: '#cffafe', color: '#0891b2' },
  waiting_return_confirmation: { label: 'Cho xac nhan tra xe', bg: '#e0f2fe', color: '#0284c7' },
  successful: { label: 'Thanh cong', bg: '#d1fae5', color: '#059669' },
  failed: { label: 'That bai', bg: '#fee2e2', color: '#dc2626' },
  declined: { label: 'Bi tu choi', bg: '#fee2e2', color: '#dc2626' },
  consigned: { label: 'Ky gui', bg: '#e0e7ff', color: '#4338ca' },
  new: { label: 'Moi', bg: '#cffafe', color: '#0891b2' },
  delivering: { label: 'Dang giao xe', bg: '#fef3c7', color: '#d97706' },
  returned: { label: 'Da tra xe', bg: '#d1fae5', color: '#059669' },
  renting: { label: 'Dang thue', bg: '#dbeafe', color: '#2563eb' },
  waiting: { label: 'Dang cho', bg: '#fef3c7', color: '#d97706' },
  signed: { label: 'Da ky', bg: '#d1fae5', color: '#059669' },
  expired: { label: 'Het han', bg: '#f3f4f6', color: '#6b7280' },
  draft: { label: 'Nhap', bg: '#f3f4f6', color: '#6b7280' },
};

const StatusBadge = ({ status, customLabel }) => {
  const cfg = STATUS_CONFIG[status] || {
    label: status || 'N/A',
    bg: '#f3f4f6',
    color: '#6b7280',
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 10px',
        borderRadius: 50,
        fontSize: '0.72rem',
        fontWeight: 600,
        background: cfg.bg,
        color: cfg.color,
        whiteSpace: 'nowrap',
        letterSpacing: '0.01em',
      }}
    >
      {customLabel || cfg.label}
    </span>
  );
};

export default StatusBadge;
