import React from 'react';
import { MdDirectionsCar } from 'react-icons/md';
import { FaFacebook, FaInstagram, FaYoutube, FaTiktok } from 'react-icons/fa';
import './Footer.css';

const Footer = () => (
    <footer className="footer">
        <div className="footer-inner">
            {/* Brand */}
            <div className="footer-brand">
                <div className="footer-logo">
                    <div className="footer-logo-dot"><MdDirectionsCar size={18} /></div>
                    SmartRent Car
                </div>
                <p className="footer-desc">
                    Nền tảng thuê xe tự lái hàng đầu Việt Nam. Kết nối chủ xe và khách thuê một cách nhanh chóng, an toàn và tiện lợi.
                </p>
                <div className="footer-social">
                    <div className="social-btn"><FaFacebook /></div>
                    <div className="social-btn"><FaInstagram /></div>
                    <div className="social-btn"><FaYoutube /></div>
                    <div className="social-btn"><FaTiktok /></div>
                </div>
                <div className="app-badges">
                    <div className="app-badge">
                        <span className="app-badge-icon">🍎</span>
                        <div>
                            <div style={{ fontSize: '0.6rem', opacity: 0.7 }}>Tải về từ</div>
                            <div style={{ fontWeight: 700, fontSize: '0.8rem' }}>App Store</div>
                        </div>
                    </div>
                    <div className="app-badge">
                        <span className="app-badge-icon">▶</span>
                        <div>
                            <div style={{ fontSize: '0.6rem', opacity: 0.7 }}>Tải về từ</div>
                            <div style={{ fontWeight: 700, fontSize: '0.8rem' }}>Google Play</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* About */}
            <div>
                <div className="footer-section-title">Về SmartRent</div>
                <div className="footer-links">
                    {['Giới thiệu', 'Tuyển dụng', 'Tin tức', 'Blog', 'Đối tác', 'Liên hệ'].map(t => (
                        <span className="footer-link" key={t}>{t}</span>
                    ))}
                </div>
            </div>

            {/* Support */}
            <div>
                <div className="footer-section-title">Hỗ trợ</div>
                <div className="footer-links">
                    {['Hướng dẫn đặt xe', 'Chính sách thuê xe', 'Quy định bảo hiểm', 'Câu hỏi thường gặp', 'Trung tâm hỗ trợ'].map(t => (
                        <span className="footer-link" key={t}>{t}</span>
                    ))}
                </div>
            </div>

            {/* Partner */}
            <div>
                <div className="footer-section-title">Chủ xe</div>
                <div className="footer-links">
                    {['Ký gửi xe', 'Hướng dẫn ký gửi', 'Chính sách chủ xe', 'Doanh thu & thống kê', 'Cộng đồng chủ xe'].map(t => (
                        <span className="footer-link" key={t}>{t}</span>
                    ))}
                </div>
            </div>
        </div>

        <div className="footer-bottom">
            <span>© 2026 SmartRent Car. Tất cả quyền được bảo lưu.</span>
            <div style={{ display: 'flex', gap: 20 }}>
                <span className="footer-link">Điều khoản sử dụng</span>
                <span className="footer-link">Chính sách bảo mật</span>
                <span className="footer-link">Cookie</span>
            </div>
        </div>
    </footer>
);

export default Footer;
