import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MdDirectionsCar, MdEmail, MdLock, MdPhone } from 'react-icons/md';
import { useAuth } from '../../../contexts/AuthContext';

const ROLE_REDIRECTS = {
  admin: '/admin/dashboard',
  showroom: '/showroom/dashboard',
  owner: '/owner/dashboard',
  renter: '/',
};

const inputCls = "w-full py-3 pl-10 pr-3 border-[1.5px] border-gray-200 rounded-lg text-[0.875rem] text-gray-800 font-[inherit] transition-[border-color,box-shadow] outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(135,206,235,0.1)]";

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
      if (phoneDigits.length !== 10) { setRegisterError('Số điện thoại phải có đúng 10 chữ số.'); return; }
      setConfirmError(''); setRegisterError('');
      navigate('/');
      return;
    }
    const result = login(form.email, form.password);
    if (result.success) {
      const from = location.state?.from?.pathname;
      const redirect = from && from !== '/login' ? from : ROLE_REDIRECTS[result.user.role] || '/';
      setTimeout(() => navigate(redirect, { replace: true }), 0);
    } else {
      setLoginError(result.error || 'Đăng nhập thất bại');
    }
  };

  const Field = ({ label, name, type = 'text', icon: Icon, placeholder, required, error, extra = {} }) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-[0.8rem] font-semibold text-gray-700">{label}</label>
      <div className="relative flex items-center">
        <Icon className="absolute left-3 text-gray-400 pointer-events-none" size={17} />
        <input
          className={`${inputCls} ${error ? 'border-red-400 shadow-[0_0_0_3px_rgba(229,62,62,0.1)]' : ''}`}
          name={name}
          type={type}
          placeholder={placeholder}
          value={form[name]}
          onChange={handleChange}
          required={required}
          {...extra}
        />
      </div>
      {error && (
        <div className="text-[0.78rem] text-red-600 font-medium flex items-center gap-1 mt-2">
          ⚠ {error}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left panel */}
      <div className="flex-1 hidden md:flex items-center justify-center px-10 py-[60px] relative overflow-hidden sticky top-0 h-screen self-start"
        style={{ background: 'linear-gradient(145deg, #e0f2fe 0%, #bae6fd 50%, #7dd3fc 100%)' }}
      >
        <div className="absolute w-[500px] h-[500px] -top-[100px] -right-[100px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(135,206,235,0.4) 0%, transparent 70%)' }} />
        <div className="absolute w-[300px] h-[300px] -bottom-[50px] -left-[50px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(135,206,235,0.3) 0%, transparent 70%)' }} />
        <div className="relative z-[1] max-w-[440px]">
          <div className="flex items-center gap-6 mb-10">
            <img src="/logo_transparent.png" alt="SmartRent Car" className="h-28 w-auto object-contain drop-shadow-md shrink-0" />
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="w-full md:w-[480px] flex flex-col justify-center bg-white px-12 py-[60px] max-[480px]:px-6 max-[480px]:py-10">
        <div className="text-[1.75rem] font-extrabold text-gray-900 mb-2">
          {tab === 'login' ? 'Chào mừng trở lại!' : 'Tạo tài khoản'}
        </div>
        <div className="text-[0.875rem] text-gray-500 mb-8">
          {tab === 'login' && 'Đăng nhập để tiếp tục thuê xe'}
        </div>

        {/* Tabs */}
        <div className="flex border-b-2 border-gray-200 mb-7">
          {['login', 'register'].map(t => (
            <div
              key={t}
              className={`flex-1 py-2.5 text-center text-[0.9rem] font-semibold cursor-pointer border-b-2 -mb-0.5 transition-all
                ${tab === t ? 'text-primary border-primary' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
              onClick={() => setTab(t)}
            >
              {t === 'login' ? 'Đăng nhập' : 'Đăng ký'}
            </div>
          ))}
        </div>

        {/* Demo credentials */}
        {tab === 'login' && (
          <div className="bg-primary-light border border-sky-200 rounded-[10px] px-3.5 py-2.5 mb-3 text-[0.75rem] text-gray-700">
            <div className="font-bold text-sky-600 mb-1">Tài khoản demo:</div>
            {[['admin@smartrent.com','Admin'],['showroom@smartrent.com','Showroom'],['owner@smartrent.com','Chủ xe'],['user@smartrent.com','Khách thuê']].map(([email, role]) => (
              <div key={email} className="py-0.5 cursor-pointer" onClick={() => setForm(f => ({ ...f, email, password: '123456' }))}>
                <span className="text-primary underline">{email}</span> <span className="text-gray-400">· {role} · 123456</span>
              </div>
            ))}
          </div>
        )}

        {loginError && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-red-600 text-[0.82rem] mb-2.5">{loginError}</div>
        )}

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {tab === 'register' && (
            <Field label="Họ và tên" name="name" icon={MdDirectionsCar} placeholder="Nguyễn Văn A" />
          )}
          {tab === 'register' && (
            <Field
              label="Số điện thoại (10 số)" name="phone" type="tel" icon={MdPhone}
              placeholder="0901234567" error={registerError}
              extra={{ inputMode: 'numeric', pattern: '[0-9]*', maxLength: 10 }}
            />
          )}
          <Field label="Email" name="email" type="email" icon={MdEmail} placeholder="example@email.com" required />
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.8rem] font-semibold text-gray-700">Mật khẩu</label>
            <div className="relative flex items-center">
              <MdLock className="absolute left-3 text-gray-400 pointer-events-none" size={17} />
              <input
                className={inputCls}
                name="password"
                type="password"
                placeholder="Nhập mật khẩu"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>
            {tab === 'login' && (
              <div className="text-[0.78rem] text-primary cursor-pointer text-right font-medium">Quên mật khẩu?</div>
            )}
          </div>
          {tab === 'register' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.8rem] font-semibold text-gray-700">Xác nhận mật khẩu</label>
              <div className="relative flex items-center">
                <MdLock className="absolute left-3 text-gray-400 pointer-events-none" size={17} />
                <input
                  className={`${inputCls} ${confirmError ? 'border-red-400 shadow-[0_0_0_3px_rgba(229,62,62,0.1)]' : ''}`}
                  name="confirmPassword"
                  type="password"
                  placeholder="Nhập lại mật khẩu"
                  value={form.confirmPassword}
                  onChange={(e) => { handleChange(e); setConfirmError(''); }}
                  required
                />
              </div>
              {confirmError && (
                <div className="text-[0.78rem] text-red-600 font-medium flex items-center gap-1 mt-2">⚠ {confirmError}</div>
              )}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3.5 bg-gradient-to-br from-primary to-primary-dark text-white font-bold rounded-xl text-[0.95rem] transition-all mt-1 tracking-wide hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(135,206,235,0.35)]"
          >
            {tab === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
          </button>
        </form>

        <div className="text-center text-[0.83rem] text-gray-500 mt-5">
          {tab === 'login'
            ? <>Chưa có tài khoản? <span className="text-primary font-semibold cursor-pointer" onClick={() => setTab('register')}>Đăng ký ngay</span></>
            : <>Đã có tài khoản? <span className="text-primary font-semibold cursor-pointer" onClick={() => setTab('login')}>Đăng nhập</span></>
          }
        </div>
      </div>
    </div>
  );
};

export default Login;
