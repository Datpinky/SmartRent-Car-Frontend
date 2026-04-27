const { body } = require("express-validator");

class ReviewValidation {
    createReview = [
        body("booking_id")
            .notEmpty()
            .withMessage("booking_id la bat buoc")
            .isMongoId()
            .withMessage("booking_id phai la MongoId hop le"),
        body("vehicle_id")
            .notEmpty()
            .withMessage("vehicle_id la bat buoc")
            .isMongoId()
            .withMessage("vehicle_id phai la MongoId hop le"),
        body("rating")
            .notEmpty()
            .withMessage("rating la bat buoc")
            .isInt({ min: 1, max: 5 })
            .withMessage("rating phai tu 1 den 5"),
        body("comment")
            .optional()
            .trim()
            .isLength({ max: 1000 })
            .withMessage("comment toi da 1000 ky tu"),
    ];

    updateReview = [
        body("review_id")
            .notEmpty()
            .withMessage("review_id la bat buoc")
            .isMongoId()
            .withMessage("review_id phai la MongoId hop le"),
        body("rating")
            .notEmpty()
            .withMessage("rating la bat buoc")
            .isInt({ min: 1, max: 5 })
            .withMessage("rating phai tu 1 den 5"),
        body("comment")
            .optional()
            .trim()
            .isLength({ max: 1000 })
            .withMessage("comment toi da 1000 ky tu"),
    ];

    getReviewsByVehicleId = [
        body("vehicle_id")
            .notEmpty()
            .withMessage("vehicle_id la bat buoc")
            .isMongoId()
            .withMessage("vehicle_id phai la MongoId hop le"),
        body("page").optional().isInt({ min: 1 }).withMessage("page phai la so nguyen >= 1"),
        body("limit").optional().isInt({ min: 1, max: 100 }).withMessage("limit phai tu 1 den 100"),
    ];
}

module.exports = new ReviewValidation();
