const { GoogleGenerativeAI } = require("@google/generative-ai");
const throwError = require("../utils/throwError");

const DAMAGE_SCHEMA_HINT = `{
  "damage_detected": boolean,
  "severity": "none" | "minor" | "moderate" | "severe",
  "summary": string,
  "differences": [{ "area": string, "description": string, "likely_new_damage": boolean }],
  "conclusion": string,
  "disclaimer": string
}`;

class AiService {
    constructor() {
        this._genAI = null;
    }

    getGenAI() {
        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            throwError("GEMINI_API_KEY (hoặc GOOGLE_API_KEY) chưa được cấu hình", 503);
        }
        if (!this._genAI) {
            this._genAI = new GoogleGenerativeAI(apiKey);
        }
        return this._genAI;
    }

    /**
     * So sánh ảnh xe trước cho thuê (doanh nghiệp) và sau khi trả (người thuê).
     * @param {{ buffer: Buffer, mimetype: string }} before - ảnh tham chiếu trước thuê
     * @param {{ buffer: Buffer, mimetype: string }} after - ảnh khi trả xe
     */
    async compareVehicleRentalDamage(before, after) {
        const genAI = this.getGenAI();
        const modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash";

        const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction:
                "Bạn là chuyên gia đánh giá tình trạng xe cho thuê. Luôn trả lời đúng định dạng JSON được yêu cầu, tiếng Việt.",
            generationConfig: {
                maxOutputTokens: 1200,
                responseMimeType: "application/json",
            },
        });

        const userText = [
            "Bạn nhận hai ảnh xe ô tô (hoặc xe máy) theo thứ tự:",
            "ẢNH 1: tình trạng xe TRƯỚC KHI cho thuê (ảnh chuẩn của doanh nghiệp).",
            "ẢNH 2: tình trạng xe KHI TRẢ (ảnh do người thuê cung cấp).",
            "",
            "Nhiệm vụ: so sánh để phát hiện thiệt hại hoặc hư hỏng mới có khả năng xảy ra trong thời gian thuê.",
            "Nếu góc chụp hoặc ánh sáng khác nhau nhiều, hãy nêu rõ độ tin cậy bị ảnh hưởng và tránh kết luận quá chắc chắn.",
            "",
            `Trả lời CHỈ bằng một object JSON hợp lệ (không markdown), đúng cấu trúc: ${DAMAGE_SCHEMA_HINT}`,
            '"disclaimer" phải nhắc rằng đánh giá mang tính hỗ trợ, không thay thế kiểm tra thực tế / pháp lý.',
        ].join("\n");

        const result = await model.generateContent([
            { text: userText },
            {
                inlineData: {
                    mimeType: before.mimetype,
                    data: before.buffer.toString("base64"),
                },
            },
            {
                inlineData: {
                    mimeType: after.mimetype,
                    data: after.buffer.toString("base64"),
                },
            },
        ]);

        const response = result.response;
        let raw;
        try {
            raw = response.text()?.trim();
        } catch {
            raw = "";
        }

        if (!raw) {
            const blockReason = response.promptFeedback?.blockReason;
            throwError(
                blockReason
                    ? `Gemini từ chối yêu cầu (${blockReason})`
                    : "Gemini không trả về nội dung",
                502,
            );
        }

        return this._parseJsonResponse(raw);
    }

    _parseJsonResponse(raw) {
        let text = raw;
        if (text.startsWith("```")) {
            text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
        }
        try {
            return JSON.parse(text);
        } catch {
            throwError("Không phân tích được kết quả AI (JSON không hợp lệ)", 502);
        }
    }
}

module.exports = new AiService();
