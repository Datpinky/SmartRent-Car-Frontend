const UploadService = require('../services/upload.service');

class UploadController {
    async uploadImageFiles(req, res, next) {
        try {
            const files = req.files || [];
            const results = await Promise.all(
                files.map((file) => UploadService.uploadBuffer(file.buffer, file.originalname))
            );

            return res.status(200).json({ message: 'Upload successful', data: results })

        } catch (error) {
            next(error);
        }
    }
}
module.exports = new UploadController();
