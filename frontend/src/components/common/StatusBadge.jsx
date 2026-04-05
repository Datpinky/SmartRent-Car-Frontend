import React from 'react';

const STATUS_CONFIG = {
  pending:     { label: 'Đang chờ',      bg: '#fef3c7', color: '#d97706' },
  approved:    { label: 'Đã duyệt',      bg: '#e0f2fe', color: '#0284c7' },
  rejected:    { label: 'Từ chối',       bg: '#fee2e2', color: '#dc2626' },
  active:      { label: 'Đang thuê',     bg: '#dbeafe', color: '#2563eb' },
  available:   { label: 'Sẵn sàng',      bg: '#e0f2fe', color: '#0284c7' },
  maintenance: { label: 'Bảo dưỡng',     bg: '#f3e8ff', color: '#7c3aed' },
  completed:   { label: 'Hoàn thành',    bg: '#e0f2fe', color: '#0284c7' },
  cancelled:   { label: 'Đã hủy',        bg: '#f3f4f6', color: '#6b7280' },
  verified:    { label: 'Đã xác minh',   bg: '#e0f2fe', color: '#0284c7' },
  unverified:  { label: 'Chưa xác minh', bg: '#fef3c7', color: '#d97706' },
  locked:      { label: 'Bị khóa',       bg: '#fee2e2', color: '#dc2626' },
  processing:  { label: 'Đang xử lý',    bg: '#dbeafe', color: '#2563eb' },
  paid:        { label: 'Đã thanh toán', bg: '#e0f2fe', color: '#0284c7' },
  failed:      { label: 'Thất bại',      bg: '#fee2e2', color: '#dc2626' },
  consigned:   { label: 'Ký gửi',        bg: '#e0e7ff', color: '#4338ca' },
  new:         { label: 'Mới',           bg: '#cffafe', color: '#0891b2' },
  delivering:  { label: 'Đang giao xe',  bg: '#fef3c7', color: '#d97706' },
  returned:    { label: 'Đã trả xe',     bg: '#e0f2fe', color: '#0284c7' },
  renting:     { label: 'Đang thuê',     bg: '#dbeafe', color: '#2563eb' },
  waiting:     { label: 'Đang chờ',      bg: '#fef3c7', color: '#d97706' },
  signed:      { label: 'Đã ký',         bg: '#e0f2fe', color: '#0284c7' },
  expired:     { label: 'Hết hạn',       bg: '#f3f4f6', color: '#6b7280' },
  draft:       { label: 'Nháp',          bg: '#f3f4f6', color: '#6b7280' },
};

const StatusBadge = ({ status, customLabel }) => {
  const cfg = STATUS_CONFIG[status] || { label: status || 'N/A', bg: '#f3f4f6', color: '#6b7280' };
  return (
    <span style={{
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
    }}>
      {customLabel || cfg.label}
    </span>
  );
};

export default StatusBadge;
