import React, { useState, useRef, useEffect } from 'react';
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

  if (!user) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[5000]">
      {/* FAB */}
      <button
        className="w-[52px] h-[52px] rounded-full bg-primary border-none text-white text-[1.2rem] flex items-center justify-center shadow-[0_4px_16px_rgba(0,177,79,0.4)] transition-all relative hover:bg-primary-dark hover:scale-[1.07]"
        onClick={() => setOpen(o => !o)}
      >
        {open ? <FaTimes /> : <FaComments />}
        {!open && totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white w-[18px] h-[18px] rounded-full text-[0.65rem] font-bold flex items-center justify-center border-2 border-white">
            {totalUnread}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="absolute bottom-16 right-0 w-[320px] bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.18)] border border-gray-200 overflow-hidden flex flex-col animate-[chatSlide_0.2s_ease] max-[400px]:w-[290px] max-[400px]:-right-2.5">
          {!activeConv ? (
            <>
              <div className="flex items-center gap-2.5 p-3.5 border-b border-gray-100 bg-white shrink-0">
                <span className="text-[0.9rem] font-bold text-gray-900 flex-1">Tin nhắn</span>
                <button className="text-gray-400 text-[0.85rem] p-1 rounded-md flex items-center hover:text-gray-700 hover:bg-gray-100" onClick={() => setOpen(false)}><FaTimes /></button>
              </div>
              <div className="overflow-y-auto max-h-[360px]">
                {MOCK_CONVERSATIONS.map(conv => (
                  <div
                    key={conv.id}
                    className="flex items-center gap-2.5 px-3.5 py-3 cursor-pointer transition-colors hover:bg-gray-50"
                    onClick={() => setActiveConv(conv)}
                  >
                    <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-[0.85rem] shrink-0 relative">
                      {conv.avatar}
                      {conv.online && <span className="absolute bottom-px right-px w-[9px] h-[9px] rounded-full bg-green-400 border-2 border-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[0.83rem] font-semibold text-gray-900">{conv.name}</div>
                      <div className="text-[0.72rem] text-gray-400 overflow-hidden text-ellipsis whitespace-nowrap">{conv.lastMsg}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <div className="text-[0.68rem] text-gray-400">{conv.time}</div>
                      {conv.unread > 0 && (
                        <span className="bg-primary text-white w-[18px] h-[18px] rounded-full flex items-center justify-center text-[0.65rem] font-bold">{conv.unread}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2.5 p-3.5 border-b border-gray-100 bg-white shrink-0">
                <button className="text-gray-400 text-[0.85rem] p-1 rounded-md flex items-center hover:text-gray-700 hover:bg-gray-100" onClick={() => setActiveConv(null)}><FaChevronLeft /></button>
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-[0.75rem] shrink-0">{activeConv.avatar}</div>
                <div className="flex-1">
                  <div className="text-[0.9rem] font-bold text-gray-900">{activeConv.name}</div>
                  <div style={{ fontSize: '0.68rem', color: activeConv.online ? '#059669' : '#9ca3af' }}>
                    {activeConv.online ? '● Online' : 'Offline'}
                  </div>
                </div>
                <button className="text-gray-400 text-[0.85rem] p-1 rounded-md flex items-center hover:text-gray-700 hover:bg-gray-100" onClick={() => setOpen(false)}><FaTimes /></button>
              </div>
              <div className="flex-1 overflow-y-auto px-3.5 py-3.5 flex flex-col gap-2.5 max-h-[300px] min-h-[200px]">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex items-end gap-1.5 ${msg.from === 'me' ? 'flex-row-reverse' : ''}`}>
                    {msg.from === 'other' && (
                      <div className="w-[26px] h-[26px] rounded-full bg-primary text-white flex items-center justify-center text-[0.65rem] font-bold shrink-0">{activeConv.avatar}</div>
                    )}
                    <div className={`flex flex-col max-w-[72%] ${msg.from === 'me' ? 'items-end' : ''}`}>
                      <div className={`px-3 py-[9px] rounded-[14px] text-[0.82rem] leading-snug
                        ${msg.from === 'me'
                          ? 'bg-primary text-white rounded-br-[4px]'
                          : 'bg-gray-100 text-gray-900 rounded-bl-[4px]'
                        }`}>
                        {msg.text}
                      </div>
                      <div className="text-[0.62rem] text-gray-400 mt-0.5">{msg.time}</div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="flex items-center gap-1.5 px-3 py-2.5 border-t border-gray-100 bg-white shrink-0">
                <button className="text-gray-400 text-[0.9rem] p-1 flex items-center hover:text-primary transition-colors"><FaImage /></button>
                <input
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 border-[1.5px] border-gray-200 rounded-full px-3 py-[7px] text-[0.82rem] outline-none transition-colors focus:border-primary"
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputText.trim()}
                  className="w-8 h-8 rounded-full bg-primary border-none text-white flex items-center justify-center text-[0.82rem] transition-colors shrink-0 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-default hover:not(:disabled):bg-primary-dark"
                >
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
