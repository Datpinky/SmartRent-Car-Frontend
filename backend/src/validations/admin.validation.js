const { param, body, query } = require("express-validator");

const STATUS_QUERY = ["pending", "approved", "rejected", "all"];

class AdminValidation {
    listUsers = [
        query("search").optional().trim().isLength({ max: 200 }).withMessage("search tối đa 200 ký tự"),
    ];

    setUserActive = [
        param("id").isMongoId().withMessage("id không hợp lệ"),
        body("is_active").isBoolean().withMessage("is_active phải là true hoặc false"),
    ];

    listShowrooms = [
        query("status")
            .optional()
            .isIn(STATUS_QUERY)
            .withMessage(`status phải là một trong: ${STATUS_QUERY.join(", ")}`),
    ];

    approveShowroom = [param("id").isMongoId().withMessage("id không hợp lệ")];

    rejectShowroom = [
        param("id").isMongoId().withMessage("id không hợp lệ"),
        body("reason").optional().trim().isLength({ max: 2000 }).withMessage("Lý do tối đa 2000 ký tự"),
    ];
}

module.exports = new AdminValidation();
