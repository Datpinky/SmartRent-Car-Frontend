/**
 * Cùng quy tắc với frontend: `frontend/src/components/common/PasswordInput.jsx` (PASSWORD_REQUIREMENTS).
 * Khi đổi một bên — cập nhật bên kia cho khớp.
 */

const RULES = [
    {
        test: (v) => typeof v === "string" && v.length >= 8,
        message: "Mật khẩu tối thiểu 8 ký tự",
    },
    { test: (v) => /[0-9]/.test(v), message: "Mật khẩu phải có ít nhất 1 chữ số" },
    { test: (v) => /[a-z]/.test(v), message: "Mật khẩu phải có ít nhất 1 chữ thường" },
    { test: (v) => /[A-Z]/.test(v), message: "Mật khẩu phải có ít nhất 1 chữ hoa" },
    {
        test: (v) => /[!-\/:-@[-`{-~]/.test(v),
        message: "Mật khẩu phải có ít nhất 1 ký tự đặc biệt",
    },
];

/**
 * @returns {{ ok: true } | { ok: false, message: string }}
 */
function validateStrongPassword(password) {
    if (password == null || password === "") {
        return { ok: false, message: "Mật khẩu là bắt buộc" };
    }
    if (typeof password !== "string") {
        return { ok: false, message: "Mật khẩu không hợp lệ" };
    }
    for (const rule of RULES) {
        if (!rule.test(password)) {
            return { ok: false, message: rule.message };
        }
    }
    return { ok: true };
}

module.exports = {
    validateStrongPassword,
    RULES,
};
