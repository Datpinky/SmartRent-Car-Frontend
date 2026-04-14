const OpenAI = require("openai");
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
        this._client = null;
    }

    getClient() {
        if (!process.env.OPENAI_API_KEY) {
            throwError("OPENAI_API_KEY chưa được cấu hình", 503);
        }
        if (!this._client) {
            this._client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        }
        return this._client;
    }

    /**
     * So sánh ảnh ô tô 4 bánh trước cho thuê (doanh nghiệp) và sau khi trả (người thuê).
     * @param {{ buffer: Buffer, mimetype: string }} before - ảnh tham chiếu trước thuê
     * @param {{ buffer: Buffer, mimetype: string }} after - ảnh khi trả xe
     */
    async compareVehicleRentalDamage(before, after) {
        const client = this.getClient();
        const beforeUrl = `data:${before.mimetype};base64,${before.buffer.toString("base64")}`;
        const afterUrl = `data:${after.mimetype};base64,${after.buffer.toString("base64")}`;

        const userText = [
            "Bạn nhận hai ảnh xe ô tô (phương tiện 4 bánh) theo thứ tự:",
            "ẢNH 1: tình trạng xe TRƯỚC KHI cho thuê (ảnh chuẩn của doanh nghiệp).",
            "ẢNH 2: tình trạng xe KHI TRẢ (ảnh do người thuê cung cấp).",
            "",
            "Nhiệm vụ: so sánh để phát hiện thiệt hại hoặc hư hỏng mới có khả năng xảy ra trong thời gian thuê.",
            "Nếu góc chụp hoặc ánh sáng khác nhau nhiều, hãy nêu rõ độ tin cậy bị ảnh hưởng và tránh kết luận quá chắc chắn.",
            "",
            `Trả lời CHỈ bằng một object JSON hợp lệ (không markdown), đúng cấu trúc: ${DAMAGE_SCHEMA_HINT}`,
            '"disclaimer" phải nhắc rằng đánh giá mang tính hỗ trợ, không thay thế kiểm tra thực tế / pháp lý.',
        ].join("\n");

        const completion = await client.chat.completions.create({
            model: process.env.OPENAI_VISION_MODEL || "gpt-4o-mini",
            max_tokens: 1200,
            messages: [
                {
                    role: "system",
                    content:
                        "Bạn là chuyên gia đánh giá tình trạng xe ô tô cho thuê (4 bánh). Luôn trả lời đúng định dạng JSON được yêu cầu, tiếng Việt.",
                },
                {
                    role: "user",
                    content: [
                        { type: "text", text: userText },
                        { type: "image_url", image_url: { url: beforeUrl } },
                        { type: "image_url", image_url: { url: afterUrl } },
                    ],
                },
            ],
        });

        const raw = completion.choices[0]?.message?.content?.trim();
        if (!raw) {
            throwError("OpenAI không trả về nội dung", 502);
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
