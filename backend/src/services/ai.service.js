const OpenAI = require("openai");
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

const SYSTEM_PROMPT_VN =
    "Bạn là chuyên gia đánh giá tình trạng xe ô tô cho thuê (4 bánh). Luôn trả lời đúng định dạng JSON được yêu cầu, tiếng Việt.";

class AiService {
    constructor() {
        this._client = null;
        this._gemini = null;
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

    getGeminiModel() {
        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            throwError("GEMINI_API_KEY (hoặc GOOGLE_API_KEY) chưa được cấu hình", 503);
        }
        if (!this._gemini) {
            this._gemini = new GoogleGenerativeAI(apiKey);
        }
        const name = process.env.GEMINI_MODEL || "gemini-2.0-flash";
        return this._gemini.getGenerativeModel({
            model: name,
            systemInstruction: SYSTEM_PROMPT_VN,
        });
    }

    _buildUserText() {
        return [
            "Bạn nhận hai ảnh xe ô tô (phương tiện 4 bánh) theo thứ tự sau lời nhắc này — ảnh đầu: TRƯỚC KHI cho thuê; ảnh thứ hai: KHI TRẢ.",
            "",
            "Nhiệm vụ: so sánh để phát hiện thiệt hại hoặc hư hỏng mới có khả năng xảy ra trong thời gian thuê.",
            "Nếu góc chụp hoặc ánh sáng khác nhau nhiều, hãy nêu rõ độ tin cậy bị ảnh hưởng và tránh kết luận quá chắc chắn.",
            "",
            `Trả lời CHỈ bằng một object JSON hợp lệ (không markdown), đúng cấu trúc: ${DAMAGE_SCHEMA_HINT}`,
            '"disclaimer" phải nhắc rằng đánh giá mang tính hỗ trợ, không thay thế kiểm tra thực tế / pháp lý.',
        ].join("\n");
    }

    /**
     * So sánh ảnh ô tô 4 bánh trước cho thuê (doanh nghiệp) và sau khi trả (người thuê).
     * Ưu tiên OpenAI nếu có OPENAI_API_KEY; không thì dùng Google Gemini nếu có GEMINI_API_KEY.
     * @param {{ buffer: Buffer, mimetype: string }} before
     * @param {{ buffer: Buffer, mimetype: string }} after
     */
    async compareVehicleRentalDamage(before, after) {
        if (process.env.OPENAI_API_KEY) {
            return this._compareWithOpenAI(before, after);
        }
        if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
            return this._compareWithGemini(before, after);
        }
        throwError("Chưa cấu hình OPENAI_API_KEY hoặc GEMINI_API_KEY cho so sánh ảnh", 503);
    }

    async _compareWithOpenAI(before, after) {
        const client = this.getClient();
        const beforeUrl = `data:${before.mimetype};base64,${before.buffer.toString("base64")}`;
        const afterUrl = `data:${after.mimetype};base64,${after.buffer.toString("base64")}`;
        const userText = this._buildUserText();

        const completion = await client.chat.completions.create({
            model: process.env.OPENAI_VISION_MODEL || "gpt-4o-mini",
            max_tokens: 1200,
            messages: [
                { role: "system", content: SYSTEM_PROMPT_VN },
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

    async _compareWithGemini(before, after) {
        const model = this.getGeminiModel();
        const userText = this._buildUserText();
        const b64_1 = before.buffer.toString("base64");
        const b64_2 = after.buffer.toString("base64");
        const m1 = before.mimetype || "image/jpeg";
        const m2 = after.mimetype || "image/jpeg";

        const res = await model.generateContent([
            userText,
            { inlineData: { data: b64_1, mimeType: m1 } },
            { inlineData: { data: b64_2, mimeType: m2 } },
        ]);

        const raw = res.response.text()?.trim();
        if (!raw) {
            const blockReason = res.response?.promptFeedback?.blockReason;
            throwError(
                blockReason ? `Gemini từ chối yêu cầu (${blockReason})` : "Gemini không trả về nội dung",
                502
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
