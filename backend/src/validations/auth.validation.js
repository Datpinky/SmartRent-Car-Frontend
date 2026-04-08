const { body } = require("express-validator");
const { validateStrongPassword } = require("../utils/passwordPolicy");

const ROLES = ["user", "owner", "showroom", "admin"];

class AuthValidation {
    register = [
        body("name").notEmpty().trim().withMessage("name là bắt buộc"),
        body("email")
            .notEmpty()
            .withMessage("email là bắt buộc")
            .isEmail()
            .withMessage("email không hợp lệ")
            .normalizeEmail(),
        body("password").custom((value) => {
            const result = validateStrongPassword(value);
            if (!result.ok) {
                throw new Error(result.message);
            }
            return true;
        }),
        body("role").optional().isIn(ROLES).withMessage("role không hợp lệ"),
        body("is_active").optional().isBoolean().withMessage("is_active phải là boolean"),
        body("age").optional().isInt({ min: 0, max: 150 }).withMessage("age không hợp lệ"),
    ];

    login = [
        body("email")
            .notEmpty()
            .withMessage("email là bắt buộc")
            .isEmail()
            .withMessage("email không hợp lệ")
            .normalizeEmail(),
        body("password").notEmpty().withMessage("password là bắt buộc"),
    ];

    registerShowroom = [
        body("name").notEmpty().trim().withMessage("Tên người liên hệ là bắt buộc"),
        body("email")
            .notEmpty().withMessage("email là bắt buộc")
            .isEmail().withMessage("email không hợp lệ")
            .normalizeEmail(),
        body("password").custom((value) => {
            const result = validateStrongPassword(value);
            if (!result.ok) throw new Error(result.message);
            return true;
        }),
        body("phone")
            .optional({ checkFalsy: true })
            .trim()
            .matches(/^\d{10}$/)
            .withMessage("Số điện thoại phải có đúng 10 chữ số"),
        body("business_name")
            .optional({ checkFalsy: true })
            .trim()
            .isLength({ max: 200 })
            .withMessage("Tên doanh nghiệp tối đa 200 ký tự"),
        body("tax_code")
            .optional({ checkFalsy: true })
            .trim()
            .isLength({ max: 20 })
            .withMessage("Mã số thuế tối đa 20 ký tự"),
        body("license_document_urls")
            .optional()
            .isArray()
            .withMessage("license_document_urls phải là mảng"),
        body("license_document_urls.*")
            .optional()
            .isURL()
            .withMessage("URL tài liệu không hợp lệ"),
    ];
}

module.exports = new AuthValidation();
