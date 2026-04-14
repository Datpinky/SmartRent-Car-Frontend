/**
 * Chạy sau multer: kiểm tra req.files (multipart field "files").
 * Format lỗi giống validate.middleware (422).
 */
function validateImageUpload(req, res, next) {
    const files = req.files || [];
    const errors = [];

    if (!files.length) {
        errors.push({
            field: "files",
            msg: "Cần ít nhất một file (form-data, field: files, tối đa 5 file)",
        });
    }

    for (const file of files) {
        if (!file.mimetype?.startsWith("image/")) {
            errors.push({
                field: "files",
                msg: `${file.originalname || "file"} không phải ảnh`,
            });
        }
    }

    if (errors.length) {
        return res.status(422).json({ message: "Validation error", errors });
    }

    next();
}

/**
 * Chạy sau multer.fields([ before_rental, after_return ]).
 * Format lỗi giống validateImageUpload (422).
 */
function validateVehicleDamageImages(req, res, next) {
    const errors = [];
    const before = req.files?.before_rental;
    const after = req.files?.after_return;

    if (!before || !before.length) {
        errors.push({
            field: "before_rental",
            msg: "Cần đúng 1 ảnh xe trước khi cho thuê (form-data, field: before_rental)",
        });
    } else if (before.length > 1) {
        errors.push({
            field: "before_rental",
            msg: "Chỉ gửi 1 file cho before_rental",
        });
    } else if (!before[0].mimetype?.startsWith("image/")) {
        errors.push({
            field: "before_rental",
            msg: `${before[0].originalname || "file"} không phải ảnh`,
        });
    }

    if (!after || !after.length) {
        errors.push({
            field: "after_return",
            msg: "Cần đúng 1 ảnh xe khi trả (form-data, field: after_return)",
        });
    } else if (after.length > 1) {
        errors.push({
            field: "after_return",
            msg: "Chỉ gửi 1 file cho after_return",
        });
    } else if (!after[0].mimetype?.startsWith("image/")) {
        errors.push({
            field: "after_return",
            msg: `${after[0].originalname || "file"} không phải ảnh`,
        });
    }

    if (errors.length) {
        return res.status(422).json({ message: "Validation error", errors });
    }

    next();
}

module.exports = { validateImageUpload, validateVehicleDamageImages };
