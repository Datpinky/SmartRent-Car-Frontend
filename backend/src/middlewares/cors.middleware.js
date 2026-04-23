const allowedOrigins = new Set([
    process.env.FRONTEND_ORIGIN || 'http://localhost:5000',
    'http://127.0.0.1:5000',
]);

const applyCorsHeaders = (req, res) => {
    const origin = req.headers.origin;

    if (!origin) {
        return true;
    }

    if (!allowedOrigins.has(origin)) {
        return false;
    }

    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    return true;
};

const handleCors = (req, res, next) => {
    if (!applyCorsHeaders(req, res)) {
        const err = new Error(`Origin ${req.headers.origin} không được phép truy cập API này`);
        err.statusCode = 403;
        console.error('CORS blocked:', err.message);
        next(err);
        return;
    }

    if (req.method === 'OPTIONS') {
        res.sendStatus(204);
        return;
    }

    next();
};

const handlePreflight = (req, res) => {
    if (!applyCorsHeaders(req, res)) {
        res.status(403).json({
            message: `Origin ${req.headers.origin} không được phép truy cập API này`,
        });
        return;
    }

    res.sendStatus(204);
};

module.exports = {
    handleCors,
    handlePreflight,
};
