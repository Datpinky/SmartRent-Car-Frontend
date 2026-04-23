import React, { useMemo, useState } from 'react';
import { CheckCheck, Eye, EyeOff, X } from 'lucide-react';
import { MdLock } from 'react-icons/md';

const inputCls =
  'w-full py-3 pl-10 pr-10 border-[1.5px] border-gray-200 rounded-lg text-[0.875rem] text-gray-800 font-[inherit] transition-[border-color,box-shadow] outline-none focus:border-primary focus:shadow-[0_0_0_3px_rgba(0,177,79,0.1)]';

/** Đồng bộ với backend: `backend/src/utils/passwordPolicy.js` */
export const PASSWORD_REQUIREMENTS = [
  { regex: /.{8,}/, text: 'Ít nhất 8 ký tự' },
  { regex: /[A-Z]/, text: 'Ít nhất 1 chữ hoa' },
  { regex: /[^A-Za-z0-9\s]/, text: 'Ít nhất 1 ký tự đặc biệt' },
];

const STRENGTH_TEXTS = {
  0: 'Nhập mật khẩu',
  1: 'Mật khẩu yếu',
  2: 'Sắp đạt yêu cầu',
  3: 'Đạt yêu cầu',
};

/** Đủ cả 3 quy tắc — dùng khi validate trước khi gửi đăng ký */
export function passwordMeetsPolicy(password) {
  return PASSWORD_REQUIREMENTS.every((req) => req.regex.test(password || ''));
}

/**
 * Ô mật khẩu có thanh độ mạnh + checklist (tab Đăng ký).
 * Controlled: value, onChange nhận synthetic event { target: { name, value } }.
 */
export function PasswordStrengthInput({
  name = 'password',
  id = 'register-password',
  value,
  onChange,
  error,
  placeholder = 'Nhập mật khẩu',
  required = true,
}) {
  const [isVisible, setIsVisible] = useState(false);

  const calculateStrength = useMemo(() => {
    const requirements = PASSWORD_REQUIREMENTS.map((req) => ({
      met: req.regex.test(value || ''),
      text: req.text,
    }));
    return {
      score: requirements.filter((req) => req.met).length,
      requirements,
    };
  }, [value]);

  const emit = (next) => {
    onChange({ target: { name, value: next } });
  };

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="relative flex items-center">
        <MdLock aria-hidden="true" className="absolute left-3 text-gray-400 pointer-events-none z-[1]" size={17} />
        <input
          id={id}
          name={name}
          type={isVisible ? 'text' : 'password'}
          value={value}
          onChange={(e) => emit(e.target.value)}
          placeholder={placeholder}
          autoComplete="new-password"
          required={required}
          aria-describedby="password-strength-hint"
          className={`${inputCls} ${error ? 'border-red-400 shadow-[0_0_0_3px_rgba(229,62,62,0.1)]' : ''}`}
        />
        <button
          type="button"
          onClick={() => setIsVisible((prev) => !prev)}
          aria-label={isVisible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          className="absolute inset-y-0 right-0 flex items-center justify-center w-10 text-gray-500 hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-r-lg"
        >
          {isVisible ? <EyeOff size={18} strokeWidth={2} /> : <Eye size={18} strokeWidth={2} />}
        </button>
      </div>

      <div className="flex gap-1.5 w-full justify-between mt-0.5">
        {PASSWORD_REQUIREMENTS.map((_, index) => {
          const step = index + 1;
          return (
            <span
              key={step}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                calculateStrength.score >= step ? 'bg-emerald-500' : 'bg-gray-200'
              }`}
            />
          );
        })}
      </div>

      <p
        id="password-strength-hint"
        className="text-[0.8rem] font-medium text-gray-700 flex justify-between gap-2"
      >
        <span>Yêu cầu:</span>
        <span className="text-primary font-semibold shrink-0">
          {STRENGTH_TEXTS[Math.min(calculateStrength.score, PASSWORD_REQUIREMENTS.length)]}
        </span>
      </p>

      <ul className="space-y-1.5" aria-label="Yêu cầu mật khẩu">
        {calculateStrength.requirements.map((req) => (
          <li key={req.text} className="flex items-center gap-2">
            {req.met ? (
              <CheckCheck size={16} className="text-emerald-500 shrink-0" strokeWidth={2} />
            ) : (
              <X size={16} className="text-gray-400 shrink-0" strokeWidth={2} />
            )}
            <span
              className={`text-[0.75rem] ${req.met ? 'text-emerald-700' : 'text-gray-500'}`}
            >
              {req.text}
              <span className="sr-only">{req.met ? ' — đã đạt' : ' — chưa đạt'}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Ô mật khẩu chỉ có nút hiện/ẩn (Xác nhận mật khẩu / Đăng nhập).
 */
export function PasswordToggleInput({
  name,
  id,
  label,
  value,
  onChange,
  error,
  placeholder = 'Nhập mật khẩu',
  autoComplete = 'current-password',
  required = false,
}) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-[0.8rem] font-semibold text-gray-700">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        <MdLock aria-hidden="true" className="absolute left-3 text-gray-400 pointer-events-none z-[1]" size={17} />
        <input
          id={id}
          name={name}
          type={isVisible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange({ target: { name, value: e.target.value } })}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          className={`${inputCls} ${error ? 'border-red-400 shadow-[0_0_0_3px_rgba(229,62,62,0.1)]' : ''}`}
        />
        <button
          type="button"
          onClick={() => setIsVisible((prev) => !prev)}
          aria-label={isVisible ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
          className="absolute inset-y-0 right-0 flex items-center justify-center w-10 text-gray-500 hover:text-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-r-lg"
        >
          {isVisible ? <EyeOff size={18} strokeWidth={2} /> : <Eye size={18} strokeWidth={2} />}
        </button>
      </div>
    </div>
  );
}

export default PasswordStrengthInput;
