import React, { useState, useRef, useEffect } from 'react';
import './NotificationBell.css';
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
    <div className="notif-bell" ref={ref}>
      <button className="notif-btn" onClick={() => setOpen(o => !o)}>
        <FaBell />
        {unread > 0 && <span className="notif-badge">{unread > 9 ? '9+' : unread}</span>}
      </button>
      {open && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <span className="notif-header-title">Thông báo {unread > 0 && <span className="nb-count">({unread})</span>}</span>
            {unread > 0 && <button className="notif-mark-all" onClick={markAllRead}><FaCheckDouble /> Đọc tất cả</button>}
          </div>
          <div className="notif-list">
            {notifications.length === 0 && (
              <div className="notif-empty">Không có thông báo nào</div>
            )}
            {notifications.map(n => {
              const tc = TYPE_ICONS[n.type] || TYPE_ICONS.booking;
              return (
                <div key={n.id} className={`notif-item ${!n.read ? 'unread' : ''}`} onClick={() => markRead(n.id)}>
                  <div className="notif-item-icon" style={{ background: tc.color + '20', color: tc.color }}>{tc.icon}</div>
                  <div className="notif-item-body">
                    <div className="notif-item-title">{n.title}</div>
                    <div className="notif-item-msg">{n.message}</div>
                    <div className="notif-item-time">{n.time}</div>
                  </div>
                  <button className="notif-item-del" onClick={e => { e.stopPropagation(); remove(n.id); }}><FaTimes /></button>
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
