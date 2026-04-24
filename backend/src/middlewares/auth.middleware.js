const userModel = require("../models/user.model");
const sessionModel = require("../models/session.model");
const { verifyAccessToken } = require("../utils/jwt");

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Missing or invalid Authorization header" });
        }

        const token = authHeader.split(" ")[1];
        const decoded = verifyAccessToken(token);

        const user = await userModel.findById(decoded.userId);
        if (!user) return res.status(401).json({ message: "User not found" });

        const jti = decoded.jti || null;

        if (jti) {
            const sess = await sessionModel.findOne({ jti, user_id: user._id });
            if (!sess) {
                return res.status(401).json({
                    message: "Phiên đăng nhập không còn hiệu lực. Vui lòng đăng nhập lại.",
                });
            }
            sessionModel.updateOne({ _id: sess._id }, { $set: { last_active_at: new Date() } }).catch(() => {});
        }

        req.user = {
            userId: user._id,
            role: user.role,
            email: user.email,
            name: user.name,
            jti,
        };
        next();
    } catch (err) {
        return res.status(401).json({ message: "Unauthorized" });
    }
};

module.exports = authMiddleware;
