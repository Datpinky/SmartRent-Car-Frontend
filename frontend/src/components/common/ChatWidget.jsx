import React, { useState, useRef, useEffect } from 'react';
import './ChatWidget.css';
import { FaComments, FaTimes, FaPaperPlane, FaImage, FaChevronLeft } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';

const MOCK_CONVERSATIONS = [
  { id: 1, name: 'Showroom Minh Hoàng',    avatar: 'M', lastMsg: 'Xe đã sẵn sàng, bạn có thể đến nhận lúc 10h ạ!', time: '10 phút', unread: 2, online: true },
  { id: 2, name: 'Auto Center Quận 1',     avatar: 'A', lastMsg: 'Cảm ơn bạn đã thuê xe!', time: '2 giờ', unread: 0, online: false },
  { id: 3, name: 'SmartRent Hỗ trợ',       avatar: 'S', lastMsg: 'Bạn cần hỗ trợ gì ạ?', time: 'Hôm qua', unread: 0, online: true },
];

const INITIAL_MESSAGES = [
  { id: 1, from: 'other', text: 'Xin chào! Bạn cần hỗ trợ gì về chuyến thuê xe ạ?', time: '09:00' },
  { id: 2, from: 'me', text: 'Chào showroom, tôi muốn hỏi về giờ nhận xe.', time: '09:02' },
  { id: 3, from: 'other', text: 'Xe đã sẵn sàng, bạn có thể đến nhận lúc 10h sáng nay ạ!', time: '09:05' },
];

const ChatWidget = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef();
  const totalUnread = MOCK_CONVERSATIONS.reduce((s, c) => s + c.unread, 0);

  useEffect(() => {
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeConv]);

  const sendMessage = () => {
    if (!inputText.trim()) return;
    const now = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { id: Date.now(), from: 'me', text: inputText, time: now }]);
    setInputText('');
    setTimeout(() => {
      setMessages(prev => [...prev, { id: Date.now() + 1, from: 'other', text: 'Cảm ơn bạn! Chúng tôi sẽ phản hồi sớm nhất có thể.', time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) }]);
    }, 1200);
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } };

  const initials = user?.name?.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase() || 'U';

  if (!user) return null;

  return (
    <div className="chat-widget">
      {/* FAB */}
      <button className="chat-fab" onClick={() => setOpen(o => !o)}>
        {open ? <FaTimes /> : <FaComments />}
        {!open && totalUnread > 0 && <span className="chat-fab-badge">{totalUnread}</span>}
      </button>

      {/* Panel */}
      {open && (
        <div className="chat-panel">
          {!activeConv ? (
            // Conversation list
            <>
              <div className="chat-panel-header">
                <span className="chat-panel-title">Tin nhắn</span>
                <button className="chat-close" onClick={() => setOpen(false)}><FaTimes /></button>
              </div>
              <div className="chat-conv-list">
                {MOCK_CONVERSATIONS.map(conv => (
                  <div key={conv.id} className="chat-conv-item" onClick={() => setActiveConv(conv)}>
                    <div className="chat-conv-avatar">
                      {conv.avatar}
                      {conv.online && <span className="chat-online-dot" />}
                    </div>
                    <div className="chat-conv-info">
                      <div className="chat-conv-name">{conv.name}</div>
                      <div className="chat-conv-last">{conv.lastMsg}</div>
                    </div>
                    <div className="chat-conv-meta">
                      <div className="chat-conv-time">{conv.time}</div>
                      {conv.unread > 0 && <span className="chat-unread-badge">{conv.unread}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            // Chat view
            <>
              <div className="chat-panel-header">
                <button className="chat-back-btn" onClick={() => setActiveConv(null)}><FaChevronLeft /></button>
                <div className="chat-conv-avatar sm">{activeConv.avatar}</div>
                <div style={{ flex: 1 }}>
                  <div className="chat-panel-title">{activeConv.name}</div>
                  <div style={{ fontSize: '0.68rem', color: activeConv.online ? '#059669' : '#9ca3af' }}>
                    {activeConv.online ? '● Online' : 'Offline'}
                  </div>
                </div>
                <button className="chat-close" onClick={() => setOpen(false)}><FaTimes /></button>
              </div>
              <div className="chat-messages">
                {messages.map(msg => (
                  <div key={msg.id} className={`chat-msg ${msg.from === 'me' ? 'mine' : 'theirs'}`}>
                    {msg.from === 'other' && <div className="chat-msg-avatar">{activeConv.avatar}</div>}
                    <div className="chat-msg-wrap">
                      <div className="chat-bubble">{msg.text}</div>
                      <div className="chat-msg-time">{msg.time}</div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="chat-input-bar">
                <button className="chat-attach-btn" title="Gửi ảnh"><FaImage /></button>
                <input value={inputText} onChange={e => setInputText(e.target.value)} onKeyDown={handleKeyDown}
                  placeholder="Nhập tin nhắn..." className="chat-input" />
                <button className="chat-send-btn" onClick={sendMessage} disabled={!inputText.trim()}>
                  <FaPaperPlane />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatWidget;
