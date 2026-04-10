const mongoose = require("mongoose");

const sessionSchema = new mongoose.Schema(
    {
        user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        jti: { type: String, required: true, unique: true },
        user_agent: { type: String, default: "" },
        ip: { type: String, default: "" },
        last_active_at: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Session", sessionSchema);
