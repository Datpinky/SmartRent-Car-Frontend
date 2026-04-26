const { body } = require("express-validator");
const { validateStrongPassword } = require("../utils/passwordPolicy");

const CONSUMER_ROLES = ["user", "owner"];
const CONSUMER_ACCOUNT_TYPES = ["renter", "user", "owner"];

class AuthValidation {
    register = [
        body("name").notEmpty().trim().withMessage("name la bat buoc"),
        body("email")
            .notEmpty()
            .withMessage("email la bat buoc")
            .isEmail()
            .withMessage("email khong hop le")
            .normalizeEmail(),
        body("password").custom((value) => {
            const result = validateStrongPassword(value);
            if (!result.ok) {
                throw new Error(result.message);
            }
            return true;
        }),
        body("phone")
            .optional({ checkFalsy: true })
            .trim()
            .matches(/^\d{10}$/)
            .withMessage("So dien thoai phai co dung 10 chu so"),
        body("role").optional().isIn(CONSUMER_ROLES).withMessage("role khong hop le"),
        body("account_type").optional().isIn(CONSUMER_ACCOUNT_TYPES).withMessage("account_type khong hop le"),
        body("age").optional().isInt({ min: 0, max: 150 }).withMessage("age khong hop le"),
    ];

    login = [
        body("email")
            .notEmpty()
            .withMessage("email la bat buoc")
            .isEmail()
            .withMessage("email khong hop le")
            .normalizeEmail(),
        body("password").notEmpty().withMessage("password la bat buoc"),
    ];

    registerShowroom = [
        body("name").notEmpty().trim().withMessage("Ten nguoi lien he la bat buoc"),
        body("email")
            .notEmpty().withMessage("email la bat buoc")
            .isEmail().withMessage("email khong hop le")
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
            .withMessage("So dien thoai phai co dung 10 chu so"),
        body("business_name")
            .optional({ checkFalsy: true })
            .trim()
            .isLength({ max: 200 })
            .withMessage("Ten doanh nghiep toi da 200 ky tu"),
        body("tax_code")
            .optional({ checkFalsy: true })
            .trim()
            .isLength({ max: 20 })
            .withMessage("Ma so thue toi da 20 ky tu"),
        body("license_document_urls")
            .optional()
            .isArray()
            .withMessage("license_document_urls phai la mang"),
        body("license_document_urls.*")
            .optional()
            .isURL()
            .withMessage("URL tai lieu khong hop le"),
    ];

    updateProfile = [
        body("name")
            .optional()
            .trim()
            .notEmpty()
            .withMessage("Ten khong duoc de trong")
            .isLength({ max: 120 })
            .withMessage("Ten toi da 120 ky tu"),
        body("phone")
            .optional({ checkFalsy: true })
            .trim()
            .matches(/^\d{10}$/)
            .withMessage("Số điện thoại phải có đúng 10 chữ số"),
        body("business_name").optional().trim().isLength({ max: 200 }).withMessage("Tên doanh nghiệp tối đa 200 ký tự"),
        body("public_address").optional().trim().isLength({ max: 500 }),
        body("opening_hours").optional().trim().isLength({ max: 200 }),
        body("policy_text").optional().trim().isLength({ max: 20000 }),
        body("logo_url").optional().trim().isLength({ max: 500 }),
        body("showroom_description").optional().trim().isLength({ max: 5000 }),
        body("showroom_representative_name").optional().trim().isLength({ max: 120 }),
        body("showroom_license_public").optional().trim().isLength({ max: 200 }),
    ];

    changePassword = [
        body("currentPassword").notEmpty().withMessage("Vui long nhap mat khau hien tai"),
        body("newPassword").custom((value) => {
            const result = validateStrongPassword(value);
            if (!result.ok) throw new Error(result.message);
            return true;
        }),
    ];
}

module.exports = new AuthValidation();
