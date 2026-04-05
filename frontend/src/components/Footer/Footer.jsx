import React from 'react';
import { MdDirectionsCar } from 'react-icons/md';
import { FaFacebook, FaInstagram, FaYoutube, FaTiktok } from 'react-icons/fa';

const Footer = () => (
  <footer className="bg-gray-50 border-t border-gray-200 text-gray-500 pt-[60px] pb-6 px-5">
    <div className="max-w-[1280px] mx-auto grid grid-cols-[2fr_1fr_1fr_1fr] gap-10 mb-10 max-[900px]:grid-cols-2 max-[560px]:grid-cols-1">
      {/* Brand */}
      <div className="flex flex-col gap-3.5">
        <div className="text-[1.4rem] font-extrabold text-gray-800 flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white">
            <MdDirectionsCar size={18} />
          </div>
          SmartRent Car
        </div>
        <p className="text-[0.85rem] leading-[1.7] text-gray-500 max-w-[280px]">
          Nền tảng thuê xe tự lái hàng đầu Việt Nam. Kết nối chủ xe và khách thuê một cách nhanh chóng, an toàn và tiện lợi.
        </p>
        <div className="flex gap-2.5 mt-1">
          {[FaFacebook, FaInstagram, FaYoutube, FaTiktok].map((Icon, i) => (
            <div key={i} className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-gray-400 text-[0.9rem] cursor-pointer border border-gray-200 transition-all hover:bg-primary hover:text-white hover:border-primary hover:-translate-y-0.5 shadow-sm">
              <Icon />
            </div>
          ))}
        </div>
        <div className="flex gap-2.5 mt-3.5">
          {[{ icon: '🍎', store: 'App Store' }, { icon: '▶', store: 'Google Play' }].map(({ icon, store }) => (
            <div key={store} className="py-[7px] px-3.5 rounded-lg border border-gray-200 bg-white flex items-center gap-2 text-[0.75rem] text-gray-700 cursor-pointer transition-all hover:border-primary hover:bg-primary/5 shadow-sm">
              <span className="text-[1.2rem]">{icon}</span>
              <div>
                <div className="text-[0.6rem] opacity-70 text-gray-400">Tải về từ</div>
                <div className="font-bold text-[0.8rem]">{store}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* About */}
      <div>
        <div className="text-[0.85rem] font-bold text-gray-700 uppercase tracking-[0.8px] mb-4">Về SmartRent</div>
        <div className="flex flex-col gap-2.5">
          {['Giới thiệu', 'Tuyển dụng', 'Tin tức', 'Blog', 'Đối tác', 'Liên hệ'].map(t => (
            <span key={t} className="text-[0.82rem] text-gray-500 cursor-pointer transition-colors hover:text-primary">{t}</span>
          ))}
        </div>
      </div>

      {/* Support */}
      <div>
        <div className="text-[0.85rem] font-bold text-gray-700 uppercase tracking-[0.8px] mb-4">Hỗ trợ</div>
        <div className="flex flex-col gap-2.5">
          {['Hướng dẫn đặt xe', 'Chính sách thuê xe', 'Quy định bảo hiểm', 'Câu hỏi thường gặp', 'Trung tâm hỗ trợ'].map(t => (
            <span key={t} className="text-[0.82rem] text-gray-500 cursor-pointer transition-colors hover:text-primary">{t}</span>
          ))}
        </div>
      </div>

      {/* Partner */}
      <div>
        <div className="text-[0.85rem] font-bold text-gray-700 uppercase tracking-[0.8px] mb-4">Chủ xe</div>
        <div className="flex flex-col gap-2.5">
          {['Ký gửi xe', 'Hướng dẫn ký gửi', 'Chính sách chủ xe', 'Doanh thu & thống kê', 'Cộng đồng chủ xe'].map(t => (
            <span key={t} className="text-[0.82rem] text-gray-500 cursor-pointer transition-colors hover:text-primary">{t}</span>
          ))}
        </div>
      </div>
    </div>

    <div className="max-w-[1280px] mx-auto border-t border-gray-200 pt-6 flex items-center justify-between text-[0.78rem] text-gray-500 max-[560px]:flex-col max-[560px]:gap-2.5 max-[560px]:text-center">
      <span>© 2026 SmartRent Car. Tất cả quyền được bảo lưu.</span>
      <div className="flex gap-5">
        <span className="cursor-pointer hover:text-primary transition-colors">Điều khoản sử dụng</span>
        <span className="cursor-pointer hover:text-primary transition-colors">Chính sách bảo mật</span>
        <span className="cursor-pointer hover:text-primary transition-colors">Cookie</span>
      </div>
    </div>
  </footer>
);

export default Footer;
