import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { MdDirectionsCar, MdEmail, MdPhone } from 'react-icons/md';
import { useAuth } from '../../../contexts/AuthContext';
import {
  PasswordStrengthInput,
  PasswordToggleInput,
  passwordMeetsPolicy,
} from '../../common/PasswordInput';

const ROLE_REDIRECTS = {
  admin: '/admin/dashboard',
  showroom: '/showroom/dashboard',
  owner: '/owner/dashboard',
  renter: '/renter/dashboard',
};

const inputCls =
  'w-full py-3 pl-10 pr-3 border-[1.5px] border-gray-200 rounded-lg text-[0.875rem] text-gray-800 font-[inherit] transition-[border-color,box-shadow] outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(0,177,79,0.1)]';

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
    <label htmlFor={`field-${name}`} className="text-[0.8rem] font-semibold text-gray-700">
      {label}
    </label>
    <div className="relative flex items-center">
      <Icon
        aria-hidden="true"
        className="pointer-events-none absolute left-3 text-gray-400"
        size={17}
      />
      <input
        id={`field-${name}`}
        className={`${inputCls} ${
          error ? 'border-red-400 shadow-[0_0_0_3px_rgba(229,62,62,0.1)]' : ''
        }`}
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
      <div
        id={`field-${name}-error`}
        role="alert"
        className="mt-2 flex items-center gap-1 text-[0.78rem] font-medium text-red-600"
      >
        Canh bao: {error}
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
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    name: '',
    accountType: 'renter',
  });
  const [confirmError, setConfirmError] = useState('');
  const [loginError, setLoginError] = useState('');
  const [registerError, setRegisterError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState('');

  const registerPasswordInvalid =
    tab === 'register' && !!registerError && !passwordMeetsPolicy(form.password);
  const registerPhoneInvalid =
    tab === 'register' &&
    !!registerError &&
    (form.phone || '').replace(/\D/g, '').length !== 10;

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === 'phone') {
      const digits = value.replace(/\D/g, '').slice(0, 10);
      setForm((current) => ({ ...current, phone: digits }));
      if (registerError) setRegisterError('');
      return;
    }

    if (name === 'accountType') {
      setForm((current) => ({ ...current, accountType: value }));
      return;
    }

    setForm((current) => ({ ...current, [name]: value }));
    if (tab === 'register' && registerError) setRegisterError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoginError('');
    setRegisterError('');
    setConfirmError('');
    setRegisterSuccess('');

    if (tab === 'register') {
      if (!passwordMeetsPolicy(form.password)) {
        setRegisterError(
          'Mat khau chua du do manh. Vui long dap ung day du cac yeu cau ben duoi o mat khau.'
        );
        return;
      }

      if (form.password !== form.confirmPassword) {
        setConfirmError('Mat khau xac nhan khong khop.');
        return;
      }

      const phoneDigits = (form.phone || '').replace(/\D/g, '');
      if (phoneDigits.length !== 10) {
        setRegisterError('So dien thoai phai co dung 10 chu so.');
        return;
      }

      setSubmitting(true);
      const result = await register(
        form.name,
        form.email,
        form.password,
        form.phone,
        form.accountType || 'renter'
      );
      setSubmitting(false);

      if (result.success) {
        setRegisterSuccess('Tao tai khoan thanh cong. Vui long dang nhap.');
        setTab('login');
        setForm((current) => ({
          ...current,
          password: '',
          confirmPassword: '',
        }));
      } else {
        setRegisterError(result.error || 'Dang ky that bai. Vui long thu lai.');
      }
      return;
    }

    setSubmitting(true);
    const result = await login(form.email, form.password);
    setSubmitting(false);

    if (result.success) {
      const from = location.state?.from?.pathname;
      const fallback = ROLE_REDIRECTS[result.user.role] || '/';
      const allowedPrefix = {
        admin: '/admin',
        showroom: '/showroom',
        owner: '/owner',
        renter: '/renter',
      }[result.user.role];

      const redirect =
        from && from !== '/login' && allowedPrefix && String(from).startsWith(allowedPrefix)
          ? from
          : fallback;

      setTimeout(() => navigate(redirect, { replace: true }), 0);
    } else {
      setLoginError(result.error || 'Dang nhap that bai');
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <div
        className="sticky top-0 hidden h-full flex-1 items-center justify-center overflow-hidden px-10 py-[60px] md:flex"
        style={{ background: 'linear-gradient(145deg, #f0fdf4 0%, #ecfdf5 50%, #f8fffc 100%)' }}
      >
        <div
          className="absolute -right-[80px] -top-[80px] h-[420px] w-[420px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(0,177,79,0.12) 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-[40px] -left-[40px] h-[280px] w-[280px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(0,177,79,0.08) 0%, transparent 70%)' }}
        />
        <div className="relative z-[1] flex w-full max-w-[400px] flex-col items-center justify-center">
          <img
            src="/logo_transparent.png"
            alt="SmartRent Logo"
            className="w-full max-w-[340px] object-contain drop-shadow-md"
          />
        </div>
      </div>

      <div className="flex h-full w-full flex-col justify-center overflow-y-auto bg-white px-12 py-[60px] md:w-[480px] max-[480px]:px-6 max-[480px]:py-10">
        <div className="mb-2 text-[1.75rem] font-extrabold text-gray-900">
          {tab === 'login' ? 'Chao mung tro lai!' : 'Tao tai khoan'}
        </div>
        <div className="mb-8 text-[0.875rem] text-gray-500">
          {tab === 'login' && 'Dang nhap de tiep tuc thue xe'}
        </div>

        <div className="mb-7 flex border-b-2 border-gray-200">
          {['login', 'register'].map((value) => (
            <button
              key={value}
              type="button"
              className={`-mb-0.5 flex-1 border-b-2 py-2.5 text-center text-[0.9rem] font-semibold transition-all ${
                tab === value
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setTab(value)}
            >
              {value === 'login' ? 'Dang nhap' : 'Dang ky'}
            </button>
          ))}
        </div>

        {registerSuccess && (
          <div className="mb-2.5 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-[0.82rem] text-green-700">
            {registerSuccess}
          </div>
        )}
        {loginError && (
          <div className="mb-2.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[0.82rem] text-red-600">
            {loginError}
          </div>
        )}
        {tab === 'register' && registerError && !registerPasswordInvalid && !registerPhoneInvalid && (
          <div className="mb-2.5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[0.82rem] text-red-600">
            {registerError}
          </div>
        )}

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          {tab === 'register' && (
            <LoginFormField
              label="Ho va ten"
              name="name"
              icon={MdDirectionsCar}
              placeholder="Nguyen Van A"
              value={form.name}
              onChange={handleChange}
            />
          )}

          {tab === 'register' && (
            <LoginFormField
              label="So dien thoai (10 so)"
              name="phone"
              type="tel"
              icon={MdPhone}
              placeholder="0901234567"
              value={form.phone}
              onChange={handleChange}
              error={registerPhoneInvalid ? registerError : ''}
              extra={{ inputMode: 'numeric', autoComplete: 'tel', maxLength: 10 }}
            />
          )}

          {tab === 'register' && (
            <div className="flex flex-col gap-2">
              <span className="text-[0.8rem] font-semibold text-gray-700">Toi muon</span>
              <div className="flex flex-col gap-2">
                {[
                  { value: 'renter', label: 'Thue xe (khach hang)' },
                  { value: 'owner', label: 'Cho thue xe ca nhan (chu xe)' },
                ].map(({ value, label }) => (
                  <label
                    key={value}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors ${
                      form.accountType === value
                        ? 'border-primary bg-primary-light'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="accountType"
                      value={value}
                      checked={form.accountType === value}
                      onChange={handleChange}
                      className="h-4 w-4 accent-primary"
                    />
                    <span className="text-[0.88rem] font-medium text-gray-800">{label}</span>
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

          {tab === 'register' ? (
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.8rem] font-semibold text-gray-700">Mat khau</label>
              <PasswordStrengthInput
                name="password"
                id="register-password"
                value={form.password}
                onChange={handleChange}
                error={registerPasswordInvalid}
                placeholder="Nhap mat khau"
              />
              {registerPasswordInvalid && (
                <div className="mt-1 flex items-center gap-1 text-[0.78rem] font-medium text-red-600">
                  Canh bao: {registerError}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <PasswordToggleInput
                label="Mat khau"
                name="password"
                id="login-password"
                value={form.password}
                onChange={handleChange}
                placeholder="Nhap mat khau"
                autoComplete="current-password"
                required
              />
              <div className="cursor-pointer text-right text-[0.78rem] font-medium text-primary">
                Quen mat khau?
              </div>
            </div>
          )}

          {tab === 'register' && (
            <div className="flex flex-col gap-1.5">
              <PasswordToggleInput
                label="Xac nhan mat khau"
                name="confirmPassword"
                id="confirm-password"
                value={form.confirmPassword}
                onChange={(event) => {
                  handleChange(event);
                  setConfirmError('');
                }}
                error={confirmError}
                placeholder="Nhap lai mat khau"
                autoComplete="new-password"
                required
              />
              {confirmError && (
                <div className="mt-2 flex items-center gap-1 text-[0.78rem] font-medium text-red-600">
                  Canh bao: {confirmError}
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="mt-1 w-full rounded-xl bg-gradient-to-br from-primary to-primary-dark py-3.5 text-[0.95rem] font-bold tracking-wide text-white transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,177,79,0.35)] disabled:cursor-not-allowed disabled:opacity-60 disabled:translate-y-0"
          >
            {submitting ? 'Dang xu ly...' : tab === 'login' ? 'Dang nhap' : 'Tao tai khoan'}
          </button>
        </form>

        <div className="mt-5 space-y-2 text-center text-[0.83rem] text-gray-500">
          {tab === 'login' ? (
            <>
              Chua co tai khoan?{' '}
              <button
                type="button"
                className="font-semibold text-primary"
                onClick={() => setTab('register')}
              >
                Dang ky ngay
              </button>
            </>
          ) : (
            <>
              Da co tai khoan?{' '}
              <button
                type="button"
                className="font-semibold text-primary"
                onClick={() => setTab('login')}
              >
                Dang nhap
              </button>
            </>
          )}

          {tab === 'register' && (
            <div>
              Ban la doanh nghiep / showroom?{' '}
              <Link to="/partner/register" className="font-semibold text-primary hover:underline">
                Dang ky doi tac
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
