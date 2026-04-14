const express = require("express");
const router = express.Router();
const multer = require("multer");
const uploadController = require("../controllers/upload.controller");
const {
    validateImageUpload,
    validateVehicleDamageImages,
} = require("../validations/upload.validation");

const upload = multer({ storage: multer.memoryStorage() });

router.post(
    "/image/files",
    upload.array("files", 5),
    validateImageUpload,
    uploadController.uploadImageFiles
);

router.post(
    "/image/vehicle-damage",
    upload.fields([
        { name: "before_rental", maxCount: 1 },
        { name: "after_return", maxCount: 1 },
    ]),
    validateVehicleDamageImages,
    uploadController.compareVehicleDamage
);

module.exports = router;
