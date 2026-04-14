import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { MdDirectionsCar, MdEmail, MdPhone } from 'react-icons/md';
import { PasswordStrengthInput, PasswordToggleInput, passwordMeetsPolicy } from '../../../components/common/PasswordInput';
import { useAuth } from '../../../contexts/AuthContext';

const ROLE_REDIRECTS = {
  admin: '/admin/dashboard',
  showroom: '/showroom/dashboard',
  owner: '/owner/dashboard',
  renter: '/renter/profile',
};

/** Sau đăng nhập từ nút "Đặt xe ngay" (CarDetail) — cùng logic với BOOK_NOW_DESTINATIONS */
const BOOK_NOW_AFTER_LOGIN = {
  renter: '/renter/bookings',
  admin: '/admin/dashboard',
  owner: '/owner/dashboard',
  showroom: '/showroom/bookings',
};

const inputCls = "w-full py-3 pl-10 pr-3 border-[1.5px] border-gray-200 rounded-lg text-[0.875rem] text-gray-800 font-[inherit] transition-[border-color,box-shadow] outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(0,177,79,0.1)]";

/**
 * Đặt ở ngoài Login để tránh remount input mỗi lần state đổi (mất focus khi gõ).
 */
const LoginFormField = ({
  label,
  name,
  type = 'text',
  icon: Icon,
  placeholder,
  required,
  value,
  onChange,
  error,
  extra = {},
}) => (
  <div className="flex flex-col gap-1.5">
    <label htmlFor={`field-${name}`} className="text-[0.8rem] font-semibold text-gray-700">{label}</label>
    <div className="relative flex items-center">
      <Icon aria-hidden="true" className="absolute left-3 text-gray-400 pointer-events-none" size={17} />
      <input
        id={`field-${name}`}
        className={`${inputCls} ${error ? 'border-red-400 shadow-[0_0_0_3px_rgba(229,62,62,0.1)]' : ''}`}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `field-${name}-error` : undefined}
        {...extra}
      />
    </div>
    {error && (
      <div id={`field-${name}-error`} role="alert" className="text-[0.78rem] text-red-600 font-medium flex items-center gap-1 mt-2">
        ⚠ {error}
      </div>
    )}
  </div>
);

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register } = useAuth();
  const [tab, setTab] = useState('login');
  const [form, setForm] = useState({
    email: '', password: '', confirmPassword: '', phone: '', name: '', accountType: 'renter',
  });
  const [confirmError, setConfirmError] = useState('');
  const [loginError, setLoginError] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const digits = value.replace(/\D/g, '').slice(0, 10);
      setForm(f => ({ ...f, phone: digits }));
      if (registerError) setRegisterError('');
      return;
    }
    if (name === 'accountType') {
      setForm(f => ({ ...f, accountType: value }));
      return;
    }
    setForm(f => ({ ...f, [name]: value }));
    if (tab === 'register' && registerError) setRegisterError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoginError(''); setRegisterError(''); setConfirmError(''); setRegisterSuccess('');

    if (tab === 'register') {
      if (!passwordMeetsPolicy(form.password)) {
        setRegisterError('Mật khẩu chưa đủ độ mạnh. Vui lòng đáp ứng đủ các yêu cầu bên dưới ô mật khẩu.');
        return;
      }
      if (form.password !== form.confirmPassword) { setConfirmError('Mật khẩu xác nhận không khớp!'); return; }
      const phoneDigits = (form.phone || '').replace(/\D/g, '');
      if (phoneDigits.length !== 10) { setRegisterError('Số điện thoại phải có đúng 10 chữ số.'); return; }
      setSubmitting(true);
      const result = await register(
        form.name,
        form.email,
        form.password,
        form.phone,
        form.accountType || 'renter',
      );
      setSubmitting(false);
      if (result.success) {
        setRegisterSuccess('Tạo tài khoản thành công! Vui lòng đăng nhập.');
        setTab('login');
        setForm(f => ({ ...f, password: '', confirmPassword: '' }));
      } else {
        setRegisterError(result.error || 'Đăng ký thất bại. Vui lòng thử lại.');
      }
      return;
    }

    setSubmitting(true);
    const result = await login(form.email, form.password);
    setSubmitting(false);
    if (result.success) {
      if (location.state?.bookNow) {
        const fromPath = location.state?.from?.pathname || '';
        const xeMatch = fromPath.match(/^\/xe\/([^/]+)/);
        if (xeMatch && (result.user.role === 'renter' || result.user.role === 'admin')) {
          setTimeout(() => navigate(`/renter/checkout/${xeMatch[1]}`, { replace: true }), 0);
          return;
        }
        const dest = BOOK_NOW_AFTER_LOGIN[result.user.role] || '/renter/bookings';
        setTimeout(() => navigate(dest, { replace: true }), 0);
        return;
      }
      const from = location.state?.from?.pathname;
      let redirect = from && from !== '/login' ? from : ROLE_REDIRECTS[result.user.role] || '/';
      // Admin chỉ được quay lại URL trong /admin — tránh lệch layout (menu admin + nội dung owner/renter)
      if (result.user.role === 'admin' && from && from !== '/login' && !String(from).startsWith('/admin')) {
        redirect = ROLE_REDIRECTS.admin;
      }
      setTimeout(() => navigate(redirect, { replace: true }), 0);
    } else {
      setLoginError(result.error || 'Đăng nhập thất bại');
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Left panel */}
      <div className="flex-1 bg-gradient-to-[145deg] from-[#1a1a2e] via-[#0f3460] to-[#16213e] hidden md:flex items-center justify-center px-10 py-[60px] relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #1a1a2e 0%, #0f3460 50%, #16213e 100%)' }}
      >
        <div className="absolute w-[500px] h-[500px] -top-[100px] -right-[100px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(0,177,79,0.2) 0%, transparent 70%)' }} />
        <div className="absolute w-[300px] h-[300px] -bottom-[50px] -left-[50px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(0,177,79,0.1) 0%, transparent 70%)' }} />
        <div className="relative z-[1] max-w-[440px]">
          <div className="flex items-center gap-3 text-[1.75rem] font-black text-white mb-10">
            <div className="w-11 h-11 bg-primary rounded-full flex items-center justify-center">
              <MdDirectionsCar aria-hidden="true" size={22} color="white" />
            </div>
            SmartRent Car
          </div>
          <h1 className="text-[2.2rem] font-extrabold text-white leading-snug mb-5">
            Thuê xe tự lái<br />
            <span className="text-primary">Nhanh chóng</span> &amp; <span className="text-primary">An toàn</span>
          </h1>
          <p className="text-base text-white/65 leading-[1.7] mb-10">
            Kết nối hàng nghìn chủ xe với khách thuê trên toàn quốc. Trải nghiệm dịch vụ thuê xe hiện đại nhất Việt Nam.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="w-full md:w-[480px] flex flex-col justify-center bg-white px-12 py-[60px] max-[480px]:px-6 max-[480px]:py-10">
          <h1 className="text-[1.75rem] font-extrabold text-gray-900 mb-2">
            {tab === 'login' ? 'Chào mừng trở lại!' : 'Tạo tài khoản'}
          </h1>
        <div className="text-[0.875rem] text-gray-500 mb-8">
          {tab === 'login' && 'Đăng nhập để tiếp tục thuê xe'}
        </div>

        {/* Tabs */}
        <div role="tablist" className="flex border-b-2 border-gray-200 mb-7">
          {['login', 'register'].map(t => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              className={`flex-1 py-2.5 text-center text-[0.9rem] font-semibold cursor-pointer border-b-2 -mb-0.5 transition-[color,border-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary
                ${tab === t ? 'text-primary border-primary' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
              onClick={() => setTab(t)}
            >
              {t === 'login' ? 'Đăng nhập' : 'Đăng ký'}
            </button>
          ))}
        </div>

        <div aria-live="polite" aria-atomic="true" className="space-y-2">
          {registerSuccess && (
            <div role="status" className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-green-700 text-[0.82rem]">{registerSuccess}</div>
          )}
          {loginError && (
            <div role="alert" className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-red-600 text-[0.82rem]">{loginError}</div>
          )}
          {tab === 'register' && registerError && (
            <div role="alert" className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-red-600 text-[0.82rem]">{registerError}</div>
          )}
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {tab === 'register' && (
            <LoginFormField
              label="Họ và tên"
              name="name"
              icon={MdDirectionsCar}
              placeholder="Nguyễn Văn A"
              value={form.name}
              onChange={handleChange}
            />
          )}
          {tab === 'register' && (
            <LoginFormField
              label="Số điện thoại (10 số)"
              name="phone"
              type="tel"
              icon={MdPhone}
              placeholder="0901234567"
              value={form.phone}
              onChange={handleChange}
              extra={{ inputMode: 'numeric', autoComplete: 'tel', maxLength: 10 }}
            />
          )}
          {tab === 'register' && (
            <div className="flex flex-col gap-2">
              <span className="text-[0.8rem] font-semibold text-gray-700">Tôi muốn</span>
              <div className="flex flex-col gap-2">
                {[
                  { value: 'renter', label: 'Thuê xe (khách hàng)' },
                  { value: 'owner', label: 'Cho thuê xe cá nhân (chủ xe)' },
                ].map(({ value, label }) => (
                  <label
                    key={value}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-colors
                      ${form.accountType === value ? 'border-primary bg-primary-light' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                  >
                    <input
                      type="radio"
                      name="accountType"
                      value={value}
                      checked={form.accountType === value}
                      onChange={handleChange}
                      className="accent-primary w-4 h-4"
                    />
                    <span className="text-[0.88rem] text-gray-800 font-medium">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          <LoginFormField
            label="Email"
            name="email"
            type="email"
            icon={MdEmail}
            placeholder="example@email.com"
            required
            value={form.email}
            onChange={handleChange}
            extra={{ autoComplete: tab === 'login' ? 'username' : 'email' }}
          />
          {tab === 'login' && (
            <>
              <PasswordToggleInput
                id="login-password"
                name="password"
                label="Mật khẩu"
                value={form.password}
                onChange={handleChange}
                placeholder="Nhập mật khẩu"
                autoComplete="current-password"
                required
              />
              <button type="button" className="text-[0.78rem] text-primary text-right font-medium -mt-1 focus-visible:outline-none focus-visible:underline">Quên mật khẩu?</button>
            </>
          )}
          {tab === 'register' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.8rem] font-semibold text-gray-700" htmlFor="register-password">
                Mật khẩu
              </label>
              <PasswordStrengthInput
                id="register-password"
                name="password"
                value={form.password}
                onChange={handleChange}
                error={!!registerError && registerError.includes('độ mạnh')}
              />
            </div>
          )}
          {tab === 'register' && (
            <div className="flex flex-col gap-1.5">
              <PasswordToggleInput
                id="register-confirm-password"
                name="confirmPassword"
                label="Xác nhận mật khẩu"
                value={form.confirmPassword}
                onChange={(e) => { handleChange(e); setConfirmError(''); }}
                placeholder="Nhập lại mật khẩu"
                error={!!confirmError}
                autoComplete="new-password"
                required
              />
              {confirmError && (
                <div className="text-[0.78rem] text-red-600 font-medium flex items-center gap-1 mt-2">⚠ {confirmError}</div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-gradient-to-br from-primary to-primary-dark text-white font-bold rounded-xl text-[0.95rem] transition-all mt-1 tracking-wide hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,177,79,0.35)] disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
          >
            {submitting ? 'Đang xử lý…' : (tab === 'login' ? 'Đăng nhập' : 'Tạo tài khoản')}
          </button>
        </form>

        <div className="text-center text-[0.83rem] text-gray-500 mt-5 space-y-2">
          {tab === 'login'
            ? <>Chưa có tài khoản? <button type="button" className="text-primary font-semibold focus-visible:outline-none focus-visible:underline" onClick={() => setTab('register')}>Đăng ký ngay</button></>
            : <>Đã có tài khoản? <button type="button" className="text-primary font-semibold focus-visible:outline-none focus-visible:underline" onClick={() => setTab('login')}>Đăng nhập</button></>
          }
          {tab === 'register' && (
            <div>
              Bạn là doanh nghiệp / showroom?{' '}
              <Link to="/partner/register" className="text-primary font-semibold hover:underline">
                Đăng ký đối tác
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
