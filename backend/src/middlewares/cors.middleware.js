const allowedOrigins = new Set([
    process.env.FRONTEND_ORIGIN || 'http://localhost:5000',
    'http://127.0.0.1:5000',
]);

const applyCorsHeaders = (req, res) => {
    const origin = req.headers.origin;

    if (!origin) {
        console.log('Không có yêu cầu gốc');
        return true;
    }

    if (!allowedOrigins.has(origin)) {
        console.error(`Origin ${origin} không được phép truy cập API này`);
        return false;
    }

    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    //console.log(`Đã cho phép truy cập cho origin ${origin}`);
    return true;
};

const handleCors = (req, res, next) => {
    if (!applyCorsHeaders(req, res)) {
        const err = new Error(`Origin ${req.headers.origin} không được phép truy cập API này`);
        err.statusCode = 403;
        console.error('CORS blocked:', err.message);
        console.log(`Thông tin yêu cầu bị chặn:`);
        console.log(`  - Phương thức: ${req.method}`);
        console.log(`  - Đường dẫn: ${req.path}`);
        console.log(`  - Origin: ${req.headers.origin}`);
        next(err);
        return;
    }
    if (req.method === 'OPTIONS') {
        console.log('Yêu cầu preflight');
        res.sendStatus(204);
        return;
    }
    //console.log(`Đã xử lý yêu cầu từ origin ${req.headers.origin}`);
    next();
};

const handlePreflight = (req, res) => {
    if (!applyCorsHeaders(req, res)) {
        console.error(`Origin ${req.headers.origin} không được phép truy cập API này`);
        res.status(403).json({
            message: `Origin ${req.headers.origin} không được phép truy cập API này`,
        });
        return;
    }
    console.log('Yêu cầu preflight được cho phép');
    res.sendStatus(204);
};


module.exports = {
    handleCors,
    handlePreflight,
};
