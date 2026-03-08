import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdDirectionsCar, MdEmail, MdLock, MdPhone } from 'react-icons/md';
import './Login.css';

const Login = () => {
    const navigate = useNavigate();
    const [tab, setTab] = useState('login');
    const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', phone: '', name: '' });
    const [confirmError, setConfirmError] = useState('');

    const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (tab === 'register' && form.password !== form.confirmPassword) {
            setConfirmError('Mật khẩu xác nhận không khớp!');
            return;
        }
        setConfirmError('');
        navigate('/');
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
                            <label className="login-label">Số điện thoại</label>
                            <div className="login-input-wrap">
                                <MdPhone className="login-input-icon" size={17} />
                                <input
                                    className="login-input"
                                    name="phone"
                                    type="tel"
                                    placeholder="0901 234 567"
                                    value={form.phone}
                                    onChange={handleChange}
                                />
                            </div>
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
