import React, { useState, useRef, useEffect } from 'react';
import { FaBell, FaTimes, FaCheckDouble } from 'react-icons/fa';
import { MdDirectionsCar, MdPayment, MdWarning, MdVerified } from 'react-icons/md';

const MOCK_NOTIFICATIONS = [
  { id: 1, type: 'booking', title: 'Đặt xe mới', message: 'Nguyễn Văn A vừa đặt Toyota Camry 2023', time: '2 phút trước', read: false },
  { id: 2, type: 'payment', title: 'Thanh toán thành công', message: 'Giao dịch #GD0023 đã được xác nhận', time: '15 phút trước', read: false },
  { id: 3, type: 'ai', title: 'AI phát hiện hư hỏng', message: 'Phát hiện vết xước trên Honda CR-V BKS: 51G-12345', time: '1 giờ trước', read: false },
  { id: 4, type: 'verify', title: 'Xác minh eKYC', message: 'Hồ sơ Trần Thị B đang chờ xét duyệt', time: '2 giờ trước', read: true },
  { id: 5, type: 'booking', title: 'Xe sắp được trả', message: 'Mazda CX-5 sẽ được trả vào 18:00 hôm nay', time: '3 giờ trước', read: true },
];

const TYPE_ICONS = {
  booking: { icon: <MdDirectionsCar />, color: '#2563eb' },
  payment: { icon: <MdPayment />, color: '#059669' },
  ai:      { icon: <MdWarning />,    color: '#d97706' },
  verify:  { icon: <MdVerified />,   color: '#7c3aed' },
};

const NotificationBell = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const ref = useRef();

  const unread = notifications.filter(n => !n.read).length;

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
        className="w-[38px] h-[38px] rounded-[10px] border-[1.5px] border-gray-200 bg-white flex items-center justify-center text-base text-gray-500 relative transition-all hover:border-primary hover:text-primary hover:bg-primary-light"
        onClick={() => setOpen(o => !o)}
      >
        <FaBell />
        {unread > 0 && (
          <span className="absolute -top-[5px] -right-[5px] bg-red-600 text-white text-[0.6rem] font-bold min-w-[16px] h-4 rounded-full flex items-center justify-center px-[3px] border-2 border-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] w-[340px] bg-white rounded-[14px] shadow-[0_8px_32px_rgba(0,0,0,0.15)] border border-gray-200 z-[8000] overflow-hidden animate-[notifIn_0.15s_ease]">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#f0f0f0]">
            <span className="text-[0.9rem] font-bold text-gray-900">
              Thông báo {unread > 0 && <span className="text-primary">({unread})</span>}
            </span>
            {unread > 0 && (
              <button
                className="text-[0.75rem] text-primary flex items-center gap-1 font-semibold hover:opacity-80"
                onClick={markAllRead}
              >
                <FaCheckDouble /> Đọc tất cả
              </button>
            )}
          </div>
          <div className="max-h-[360px] overflow-y-auto">
            {notifications.length === 0 && (
              <div className="text-center text-gray-400 py-8 text-[0.85rem]">Không có thông báo nào</div>
            )}
            {notifications.map(n => {
              const tc = TYPE_ICONS[n.type] || TYPE_ICONS.booking;
              return (
                <div
                  key={n.id}
                  className={`flex items-start gap-2.5 px-3.5 py-3 cursor-pointer border-b border-gray-50 transition-colors relative hover:bg-gray-50
                    ${!n.read ? 'bg-primary-light' : ''}`}
                  onClick={() => markRead(n.id)}
                >
                  {!n.read && <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary" />}
                  <div
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
                  <button
                    className="text-gray-300 p-0.5 flex items-center text-[0.75rem] shrink-0 hover:text-red-600 transition-colors"
                    onClick={e => { e.stopPropagation(); remove(n.id); }}
                  >
                    <FaTimes />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
