import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MdDirectionsCar, MdEmail, MdLock, MdPhone } from 'react-icons/md';
import { useAuth } from '../../../contexts/AuthContext';
import './Login.css';

const ROLE_REDIRECTS = {
  admin: '/admin/dashboard',
  showroom: '/showroom/dashboard',
  owner: '/owner/dashboard',
  renter: '/renter/profile',
};

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const [tab, setTab] = useState('login');
    const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', phone: '', name: '' });
    const [confirmError, setConfirmError] = useState('');
    const [loginError, setLoginError] = useState('');
    const [registerError, setRegisterError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'phone') {
            const digits = value.replace(/\D/g, '').slice(0, 10);
            setForm(f => ({ ...f, phone: digits }));
            return;
        }
        setForm(f => ({ ...f, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (tab === 'register') {
            if (form.password !== form.confirmPassword) { setConfirmError('Mật khẩu xác nhận không khớp!'); return; }
            const phoneDigits = (form.phone || '').replace(/\D/g, '');
            if (phoneDigits.length !== 10) {
                setRegisterError('Số điện thoại phải có đúng 10 chữ số.');
                return;
            }
            setConfirmError('');
            setRegisterError('');
            navigate('/');
            return;
        }
        const result = login(form.email, form.password);
        if (result.success) {
            const from = location.state?.from?.pathname;
            const redirect = from && from !== '/login' ? from : ROLE_REDIRECTS[result.user.role] || '/';
            // Defer navigate to next tick so AuthProvider state is committed before route renders
            setTimeout(() => navigate(redirect, { replace: true }), 0);
        } else {
            setLoginError(result.error || 'Đăng nhập thất bại');
        }
    };

    return (
        <div className="login-page">
            {/* Left */}
            <div className="login-left">
                <div className="login-left-content">
                    <div className="login-left-logo">
                        <div className="login-left-logo-dot"><MdDirectionsCar size={22} color="white" /></div>
                        <h2>SmartRent Car</h2>
                    </div>
                    <h1 className="login-left-headline">
                        Thuê xe tự lái<br /><span>Nhanh chóng</span> <span> & </span> <span>An toàn</span>
                    </h1>
                    <p className="login-left-desc">
                        Kết nối hàng nghìn chủ xe với khách thuê trên toàn quốc. Trải nghiệm dịch vụ thuê xe hiện đại nhất Việt Nam.
                    </p>
                </div>
            </div>

            {/* Right */}
            <div className="login-right">
                <div className="login-form-title">
                    {tab === 'login' ? 'Chào mừng trở lại!' : 'Tạo tài khoản'}
                </div>
                <div className="login-form-sub">
                    {tab === 'login' && 'Đăng nhập để tiếp tục thuê xe'}
                </div>

                {/* Tabs */}
                <div className="login-tabs">
                    <div className={`login-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => setTab('login')}>Đăng nhập</div>
                    <div className={`login-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => setTab('register')}>Đăng ký</div>
                </div>


                {/* Demo credentials */}
                {tab === 'login' && (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 14px', marginBottom: 12, fontSize: '0.75rem', color: '#374151' }}>
                    <div style={{ fontWeight: 700, color: '#059669', marginBottom: 4 }}>Tài khoản demo:</div>
                    {[['admin@smartrent.com','Admin'],['showroom@smartrent.com','Showroom'],['owner@smartrent.com','Chủ xe'],['user@smartrent.com','Khách thuê']].map(([email, role]) => (
                      <div key={email} style={{ cursor: 'pointer', padding: '2px 0' }} onClick={() => setForm(f => ({ ...f, email, password: '123456' }))}>
                        <span style={{ color: '#00b14f', textDecoration: 'underline' }}>{email}</span> <span style={{ color: '#9ca3af' }}>· {role} · 123456</span>
                      </div>
                    ))}
                  </div>
                )}

                {loginError && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px', color: '#dc2626', fontSize: '0.82rem', marginBottom: 10 }}>{loginError}</div>}

                {/* Form */}
                <form className="login-form" onSubmit={handleSubmit}>
                    {tab === 'register' && (
                        <div className="login-field">
                            <label className="login-label">Họ và tên</label>
                            <div className="login-input-wrap">
                                <MdDirectionsCar className="login-input-icon" size={17} />
                                <input
                                    className="login-input"
                                    name="name"
                                    placeholder="Nguyễn Văn A"
                                    value={form.name}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    )}

                    {tab === 'register' && (
                        <div className="login-field">
                            <label className="login-label">Số điện thoại (10 số)</label>
                            <div className="login-input-wrap">
                                <MdPhone className="login-input-icon" size={17} />
                                <input
                                    className="login-input"
                                    name="phone"
                                    type="tel"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    maxLength={10}
                                    placeholder="0901234567"
                                    value={form.phone}
                                    onChange={handleChange}
                                />
                            </div>
                            {registerError && <div className="login-error-msg">{registerError}</div>}
                        </div>
                    )}

                    <div className="login-field">
                        <label className="login-label">Email</label>
                        <div className="login-input-wrap">
                            <MdEmail className="login-input-icon" size={17} />
                            <input
                                className="login-input"
                                name="email"
                                type="email"
                                placeholder="example@email.com"
                                value={form.email}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="login-field">
                        <label className="login-label">Mật khẩu</label>
                        <div className="login-input-wrap">
                            <MdLock className="login-input-icon" size={17} />
                            <input
                                className="login-input"
                                name="password"
                                type="password"
                                placeholder="Nhập mật khẩu"
                                value={form.password}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        {tab === 'login' && (
                            <div className="login-forgot">Quên mật khẩu?</div>
                        )}
                    </div>

                    {tab === 'register' && (
                        <div className="login-field">
                            <label className="login-label">Xác nhận mật khẩu</label>
                            <div className="login-input-wrap">
                                <MdLock className="login-input-icon" size={17} />
                                <input
                                    className={`login-input ${confirmError ? 'input-error' : ''}`}
                                    name="confirmPassword"
                                    type="password"
                                    placeholder="Nhập lại mật khẩu"
                                    value={form.confirmPassword}
                                    onChange={(e) => {
                                        handleChange(e);
                                        setConfirmError('');
                                    }}
                                    required
                                />
                            </div>
                            {confirmError && (
                                <div className="login-error-msg">{confirmError}</div>
                            )}
                        </div>
                    )}

                    <button type="submit" className="btn-login-submit">
                        {tab === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
                    </button>
                </form>

                <div className="login-signup-link">
                    {tab === 'login'
                        ? <>Chưa có tài khoản? <span onClick={() => setTab('register')}>Đăng ký ngay</span></>
                        : <>Đã có tài khoản? <span onClick={() => setTab('login')}>Đăng nhập</span></>
                    }
                </div>
            </div>
        </div>
    );
};

export default Login;
