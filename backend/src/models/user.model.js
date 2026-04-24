const mongoose = require('mongoose')
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
        },

        password: {
            type: String,
            required: true,
            minlength: 6,
            select: false,
        },

        role: {
            type: String,
            enum: ["user", "owner", "showroom", "admin"],
            default: "user"
        },

        phone: { type: String, trim: true, default: "" },

        /** Chỉ áp dụng khi role === "showroom" */
        showroom_status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
        },
        business_name: { type: String, trim: true, default: "" },
        tax_code: { type: String, trim: true, default: "" },
        license_document_urls: { type: [String], default: [] },
        showroom_rejection_reason: { type: String, trim: true, default: "" },

        /** Hồ sơ showroom công khai (role showroom) */
        public_address: { type: String, trim: true, default: "" },
        opening_hours: { type: String, trim: true, default: "" },
        policy_text: { type: String, trim: true, default: "" },
        logo_url: { type: String, trim: true, default: "" },
        showroom_description: { type: String, trim: true, default: "" },
        showroom_representative_name: { type: String, trim: true, default: "" },
        showroom_license_public: { type: String, trim: true, default: "" },

        is_active: {
            type: Boolean,
            default: true
        },

        age: {
            type: Number,
        },
    },
    { timestamps: true }
);

userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (plainPassword) {
    return bcrypt.compare(plainPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
