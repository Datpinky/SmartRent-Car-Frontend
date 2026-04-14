/**
 * Chuỗi hiển thị phiên đăng nhập (OS – trình duyệt · thời gian), đồng bộ giao diện với trang Hồ sơ.
 */
function parseOs(ua) {
    if (!ua || typeof ua !== "string") return "Thiết bị";
    if (/Windows/i.test(ua)) return "Windows";
    if (/Mac OS|Macintosh/i.test(ua)) return "macOS";
    if (/Linux/i.test(ua) && !/Android/i.test(ua)) return "Linux";
    if (/Android/i.test(ua)) return "Android";
    if (/iPhone|iPad|iPod/i.test(ua)) return "iOS";
    return "Thiết bị";
}

function parseBrowser(ua) {
    if (!ua || typeof ua !== "string") return "Trình duyệt";
    if (/Edg/i.test(ua)) return "Edge";
    if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) return "Chrome";
    if (/Firefox/i.test(ua)) return "Firefox";
    if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return "Safari";
    return "Trình duyệt";
}

function isLocalIp(ip) {
    if (!ip) return true;
    const s = String(ip).trim();
    return s === "::1" || s === "127.0.0.1" || s === "::ffff:127.0.0.1";
}

function buildSessionSummaryLine(userAgent, ip, when) {
    const os = parseOs(userAgent);
    const browser = parseBrowser(userAgent);
    const dateStr = new Date(when).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
    const ipPart = ip && !isLocalIp(ip) ? ` – ${ip}` : "";
    return `${os} – ${browser}${ipPart} · ${dateStr}`;
}

module.exports = { parseOs, parseBrowser, buildSessionSummaryLine };
