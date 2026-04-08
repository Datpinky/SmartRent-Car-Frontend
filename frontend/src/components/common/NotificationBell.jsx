import React, { useState, useRef, useEffect, useMemo, useId } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBell, FaTimes, FaCheckDouble } from 'react-icons/fa';
import { MdDirectionsCar, MdPayment, MdWarning, MdVerified } from 'react-icons/md';
import { useAuth } from '../../contexts/AuthContext';

/** Cảnh báo cần xử lý (trước đây ở Admin Dashboard) — chỉ admin */
const ADMIN_ACTION_ALERTS = [
  { id: 'admin-alert-showroom', variant: 'warning', msg: 'Showroom "Xe Tốt Thủ Đức" đang chờ xác minh', action: '/admin/showrooms', actionLabel: 'Xem ngay' },
  { id: 'admin-alert-ai', variant: 'info', msg: 'Hệ thống AI phát hiện 1 hư hỏng mới trên Honda CR-V BKS 51H-23456', action: '/admin/reports', actionLabel: 'Xem báo cáo' },
];

const MOCK_NOTIFICATIONS = [
  { id: 1, type: 'booking', title: 'Đặt xe mới', message: 'Nguyễn Văn A vừa đặt Toyota Camry 2023', time: '2 phút trước', read: false },
  { id: 2, type: 'payment', title: 'Thanh toán thành công', message: 'Giao dịch #GD0023 đã được xác nhận', time: '15 phút trước', read: false },
  { id: 3, type: 'ai', title: 'AI phát hiện hư hỏng', message: 'Phát hiện vết xước trên Honda CR-V BKS: 51G-12345', time: '1 giờ trước', read: false },
  { id: 4, type: 'verify', title: 'Xác minh Showroom', message: 'Hồ sơ đối tác mới đang chờ xét duyệt', time: '2 giờ trước', read: true },
  { id: 5, type: 'booking', title: 'Xe sắp được trả', message: 'Mazda CX-5 sẽ được trả vào 18:00 hôm nay', time: '3 giờ trước', read: true },
];

const TYPE_ICONS = {
  booking: { icon: <MdDirectionsCar aria-hidden="true" />, color: '#2563eb' },
  payment: { icon: <MdPayment aria-hidden="true" />, color: '#059669' },
  ai:      { icon: <MdWarning aria-hidden="true" />,    color: '#d97706' },
  verify:  { icon: <MdVerified aria-hidden="true" />,   color: '#7c3aed' },
};

const NotificationBell = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [dismissedActionIds, setDismissedActionIds] = useState(() => new Set());
  const ref = useRef();

  const isAdmin = user?.role === 'admin';
  const visibleActionAlerts = useMemo(
    () => (isAdmin ? ADMIN_ACTION_ALERTS.filter((a) => !dismissedActionIds.has(a.id)) : []),
    [isAdmin, dismissedActionIds]
  );

  const unreadList = notifications.filter((n) => !n.read).length;
  const unread = unreadList + visibleActionAlerts.length;

  const dismissActionAlert = (id) => {
    setDismissedActionIds((prev) => new Set([...prev, id]));
  };

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const markRead = (id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const remove = (id) => setNotifications(prev => prev.filter(n => n.id !== id));

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label={unread > 0 ? `Thông báo (${unread} chưa đọc)` : 'Thông báo'}
        aria-expanded={open}
        aria-controls={panelId}
        className="w-[38px] h-[38px] rounded-[10px] border-[1.5px] border-gray-200 bg-white flex items-center justify-center text-base text-gray-500 relative transition-[border-color,color,background-color] hover:border-primary hover:text-primary hover:bg-primary-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        onClick={() => setOpen(o => !o)}
      >
        <FaBell aria-hidden="true" />
        {unread > 0 && (
          <span
            aria-hidden="true"
            className="absolute -top-[5px] -right-[5px] bg-red-600 text-white text-[0.6rem] font-bold min-w-[16px] h-4 rounded-full flex items-center justify-center px-[3px] border-2 border-white"
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          id={panelId}
          role="region"
          aria-label="Danh sách thông báo"
          aria-live="polite"
          className="absolute right-0 top-[calc(100%+8px)] w-[min(100vw-24px,380px)] bg-white rounded-[14px] shadow-[0_8px_32px_rgba(0,0,0,0.15)] border border-gray-200 z-[8000] overflow-hidden animate-[notifIn_0.15s_ease] motion-reduce:animate-none"
        >
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#f0f0f0]">
            <span className="text-[0.9rem] font-bold text-gray-900">
              Thông báo {unread > 0 && <span className="text-primary">({unread})</span>}
            </span>
            {(unreadList > 0 || visibleActionAlerts.length > 0) && (
              <button
                type="button"
                className="text-[0.75rem] text-primary flex items-center gap-1 font-semibold hover:opacity-80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded"
                onClick={() => {
                  markAllRead();
                  setDismissedActionIds(() => new Set(ADMIN_ACTION_ALERTS.map((a) => a.id)));
                }}
              >
                <FaCheckDouble aria-hidden="true" /> Đọc tất cả
              </button>
            )}
          </div>
          <div className="max-h-[min(70vh,420px)] overflow-y-auto overscroll-contain">
            {visibleActionAlerts.length > 0 && (
              <div className="px-3 pt-3 pb-1">
                <div className="text-[0.72rem] font-bold uppercase tracking-wide text-gray-500 mb-2 px-0.5">
                  Cảnh báo cần xử lý
                </div>
                <div className="flex flex-col gap-2">
                  {visibleActionAlerts.map((a) => (
                    <div
                      key={a.id}
                      className={`relative flex items-center gap-2.5 rounded-xl border px-3 py-2.5 pr-8 text-[0.82rem] leading-snug ${
                        a.variant === 'warning'
                          ? 'bg-amber-50 border-amber-200 text-amber-900'
                          : 'bg-blue-50 border-blue-200 text-blue-900'
                      }`}
                    >
                      <MdWarning aria-hidden="true" className="shrink-0 text-[1.15rem] opacity-90" />
                      <span className="flex-1 min-w-0">{a.msg}</span>
                      <button
                        type="button"
                        className={`shrink-0 rounded-lg px-2.5 py-1 text-[0.72rem] font-bold border transition-[border-color,background-color] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary ${
                          a.variant === 'warning'
                            ? 'border-amber-300 bg-white/80 text-amber-900 hover:bg-white'
                            : 'border-blue-300 bg-white/80 text-blue-900 hover:bg-white'
                        }`}
                        onClick={() => { navigate(a.action); setOpen(false); }}
                      >
                        {a.actionLabel}
                      </button>
                      <button
                        type="button"
                        className="absolute top-1.5 right-1.5 p-0.5 text-gray-400 hover:text-red-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-400 rounded"
                        aria-label="Bỏ qua cảnh báo"
                        onClick={() => dismissActionAlert(a.id)}
                      >
                        <FaTimes aria-hidden="true" className="text-[0.7rem]" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {notifications.length > 0 && (
              <div className={`px-3 ${visibleActionAlerts.length ? 'pt-2 pb-1 border-t border-gray-100' : 'pt-3 pb-1'}`}>
                <div className="text-[0.72rem] font-bold uppercase tracking-wide text-gray-500 mb-2 px-0.5">
                  Hoạt động gần đây
                </div>
              </div>
            )}

            {notifications.length === 0 && visibleActionAlerts.length === 0 && (
              <div className="text-center text-gray-400 py-8 text-[0.85rem]">Không có thông báo nào</div>
            )}

            {notifications.map(n => {
              const tc = TYPE_ICONS[n.type] || TYPE_ICONS.booking;
              return (
                <button
                  key={n.id}
                  type="button"
                  aria-label={`${n.title}: ${n.message}${!n.read ? ' (chưa đọc)' : ''}`}
                  className={`w-full text-left flex items-start gap-2.5 px-3.5 py-3 border-b border-gray-50 transition-colors relative hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary
                    ${!n.read ? 'bg-primary-light' : ''}`}
                  onClick={() => markRead(n.id)}
                >
                  {!n.read && <span aria-hidden="true" className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary" />}
                  <div
                    aria-hidden="true"
                    className="w-[34px] h-[34px] rounded-[9px] flex items-center justify-center text-[0.95rem] shrink-0"
                    style={{ background: tc.color + '20', color: tc.color }}
                  >
                    {tc.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[0.8rem] font-semibold text-gray-900">{n.title}</div>
                    <div className="text-[0.75rem] text-gray-500 mt-0.5 leading-snug">{n.message}</div>
                    <div className="text-[0.7rem] text-gray-400 mt-0.5">{n.time}</div>
                  </div>
                  <span
                    role="button"
                    aria-label={`Xóa thông báo: ${n.title}`}
                    tabIndex={0}
                    className="text-gray-300 p-0.5 flex items-center text-[0.75rem] shrink-0 hover:text-red-600 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-400 rounded"
                    onClick={e => { e.stopPropagation(); remove(n.id); }}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); remove(n.id); } }}
                  >
                    <FaTimes aria-hidden="true" />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
