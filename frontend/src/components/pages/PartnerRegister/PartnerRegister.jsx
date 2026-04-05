import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MdDirectionsCar, MdEmail, MdLock, MdPhone, MdBusiness, MdBadge } from 'react-icons/md';
import authService from '../../../services/authService';
import FileUpload from '../../common/FileUpload';

const inputCls =
  'w-full py-3 pl-10 pr-3 border-[1.5px] border-gray-200 rounded-lg text-[0.875rem] text-gray-800 font-[inherit] transition-[border-color,box-shadow] outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(0,177,79,0.1)]';

/** Tách ra ngoài để tránh mất focus khi gõ (không định nghĩa component con bên trong PartnerRegister). */
const PartnerFormField = ({ label, name, type = 'text', icon: Icon, placeholder, required, value, onChange, extra = {} }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[0.8rem] font-semibold text-gray-700">{label}</label>
    <div className="relative flex items-center">
      <Icon className="absolute left-3 text-gray-400 pointer-events-none" size={17} />
      <input
        className={inputCls}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        {...extra}
      />
    </div>
  </div>
);

const PartnerRegister = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    business_name: '',
    tax_code: '',
  });
  const [licenseUrls, setLicenseUrls] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const digits = value.replace(/\D/g, '').slice(0, 10);
      setForm((f) => ({ ...f, phone: digits }));
      if (error) setError('');
      return;
    }
    setForm((f) => ({ ...f, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (form.password !== form.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }
    if (form.phone.length !== 10) {
      setError('Số điện thoại phải có đúng 10 chữ số.');
      return;
    }
    setSubmitting(true);
    try {
      await authService.registerShowroom({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        phone: form.phone,
        business_name: form.business_name.trim(),
        tax_code: form.tax_code.trim(),
        license_document_urls: licenseUrls.length ? licenseUrls : undefined,
      });
      setSuccess('Đăng ký thành công! Tài khoản đang chờ admin duyệt. Bạn có thể đăng nhập sau khi được phê duyệt.');
      setTimeout(() => navigate('/login', { replace: true }), 2500);
    } catch (err) {
      setError(err.message || 'Đăng ký thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <div className="flex-1 hidden md:flex items-center justify-center bg-gradient-to-br from-secondary via-[#0f3460] to-[#16213e] px-10 py-14">
        <div className="max-w-md text-white">
          <div className="flex items-center gap-3 text-2xl font-black mb-6">
            <div className="w-11 h-11 bg-primary rounded-full flex items-center justify-center">
              <MdBusiness size={22} />
            </div>
            Đối tác Showroom
          </div>
          <p className="text-white/70 leading-relaxed text-[0.95rem]">
            Đăng ký tài khoản doanh nghiệp để quản lý xe, đơn đặt và doanh thu trên SmartRent. Sau khi gửi hồ sơ, đội ngũ
            admin sẽ xác minh và kích hoạt tài khoản.
          </p>
        </div>
      </div>

      <div className="w-full md:w-[520px] flex flex-col justify-center bg-white px-10 py-12 max-[480px]:px-5">
        <h1 className="text-[1.65rem] font-extrabold text-gray-900 mb-1">Đăng ký đối tác</h1>
        <p className="text-[0.875rem] text-gray-500 mb-6">Dành cho showroom / doanh nghiệp cho thuê xe</p>

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-800 text-[0.85rem] mb-4">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-[0.85rem] mb-4">{error}</div>
        )}

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <PartnerFormField
            label="Tên người liên hệ"
            name="name"
            icon={MdDirectionsCar}
            placeholder="Nguyễn Văn A"
            required
            value={form.name}
            onChange={handleChange}
          />
          <PartnerFormField
            label="Email đăng nhập"
            name="email"
            type="email"
            icon={MdEmail}
            placeholder="partner@company.com"
            required
            value={form.email}
            onChange={handleChange}
            extra={{ autoComplete: 'email' }}
          />
          <PartnerFormField
            label="Số điện thoại (10 số)"
            name="phone"
            type="tel"
            icon={MdPhone}
            placeholder="0901234567"
            required
            value={form.phone}
            onChange={handleChange}
            extra={{ inputMode: 'numeric', autoComplete: 'tel', maxLength: 10 }}
          />
          <PartnerFormField
            label="Tên doanh nghiệp / Showroom"
            name="business_name"
            icon={MdBusiness}
            placeholder="Công ty TNHH ..."
            required
            value={form.business_name}
            onChange={handleChange}
          />
          <PartnerFormField
            label="Mã số thuế"
            name="tax_code"
            icon={MdBadge}
            placeholder="0123456789"
            required
            value={form.tax_code}
            onChange={handleChange}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-[0.8rem] font-semibold text-gray-700">Mật khẩu</label>
            <div className="relative flex items-center">
              <MdLock className="absolute left-3 text-gray-400 pointer-events-none" size={17} />
              <input
                className={inputCls}
                name="password"
                type="password"
                placeholder="Tối thiểu 6 ký tự"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.8rem] font-semibold text-gray-700">Xác nhận mật khẩu</label>
            <div className="relative flex items-center">
              <MdLock className="absolute left-3 text-gray-400 pointer-events-none" size={17} />
              <input
                className={inputCls}
                name="confirmPassword"
                type="password"
                placeholder="Nhập lại mật khẩu"
                value={form.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <FileUpload
            label="Giấy phép kinh doanh (ảnh, tối đa 5 file)"
            multiple
            maxFiles={5}
            hint="Ảnh sẽ được tải lên máy chủ; URL dùng để admin xác minh."
            onUpload={(urls) => setLicenseUrls(urls || [])}
          />

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-gradient-to-br from-primary to-primary-dark text-white font-bold rounded-xl text-[0.95rem] tracking-wide hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,177,79,0.35)] disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0 mt-1"
          >
            {submitting ? 'Đang gửi...' : 'Gửi hồ sơ đăng ký'}
          </button>
        </form>

        <div className="text-center text-[0.83rem] text-gray-500 mt-5">
          <Link to="/login" className="text-primary font-semibold hover:underline">
            Quay lại đăng nhập
          </Link>
          {' · '}
          <Link to="/" className="text-gray-600 hover:underline">
            Về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PartnerRegister;
