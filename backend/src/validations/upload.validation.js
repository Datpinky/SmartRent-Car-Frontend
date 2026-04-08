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

module.exports = { validateImageUpload };
