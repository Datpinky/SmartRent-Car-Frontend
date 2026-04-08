const express = require("express");
const router = express.Router();
const multer = require("multer");
const uploadController = require("../controllers/upload.controller");
const { validateImageUpload } = require("../validations/upload.validation");

const upload = multer({ storage: multer.memoryStorage() });

router.post(
    "/image/files",
    upload.array("files", 5),
    validateImageUpload,
    uploadController.uploadImageFiles
);

module.exports = router;
