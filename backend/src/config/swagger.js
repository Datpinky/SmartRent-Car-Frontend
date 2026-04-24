const port = process.env.PORT || 3000;
const baseUrl = process.env.SWAGGER_SERVER_URL || `http://localhost:${port}`;

const routeMounts = [
    { prefix: "/api/auth", tag: "Auth", router: require("../routes/auth.route") },
    { prefix: "/api/uploads", tag: "Uploads", router: require("../routes/upload.route") },
    { prefix: "/api/vehicles", tag: "Vehicles", router: require("../routes/vehicle.route") },
    { prefix: "/api/vehicle_location", tag: "Vehicle Location", router: require("../routes/vehicleLocation.routes") },
    { prefix: "/api/reviews", tag: "Reviews", router: require("../routes/review.route") },
    { prefix: "/api/favorites", tag: "Favorites", router: require("../routes/favorite.route") },
    { prefix: "/api/admin", tag: "Admin", router: require("../routes/admin.route") },
    { prefix: "/api/notifications", tag: "Notifications", router: require("../routes/notification.route") },
    { prefix: "/api/booking", tag: "Booking", router: require("../routes/booking.route") },
    { prefix: "/api/payment", tag: "Payment", router: require("../routes/payment.route") },
    { prefix: "/api/showrooms", tag: "Showrooms", router: require("../routes/showroom.route") },
    { prefix: "/api/contracts", tag: "Contracts", router: require("../routes/contract.route") },
    { prefix: "/api/vehicle-damage-inspections", tag: "Vehicle Damage Inspections", router: require("../routes/vehicleDamageInspection.route") },
];

function normalizeExpressPath(path) {
    return path.replace(/:([A-Za-z0-9_]+)/g, "{$1}").replace(/\/+/g, "/");
}

function toFullPath(prefix, routePath) {
    const pathPart = routePath === "/" ? "" : routePath;
    return normalizeExpressPath(`${prefix}${pathPart || ""}`) || "/";
}

function getPathParameters(path) {
    const matches = [...path.matchAll(/\{([^}]+)\}/g)];
    return matches.map((match) => ({
        in: "path",
        name: match[1],
        required: true,
        schema: { type: "string" },
    }));
}

function inferSecurity(routeLayer) {
    const middlewareNames = (routeLayer.route?.stack || []).map((s) => s.name);
    if (middlewareNames.includes("authMiddleware")) {
        return [{ bearerAuth: [] }];
    }
    return undefined;
}

function buildOperation({ method, path, tag, routeLayer }) {
    const lower = method.toLowerCase();
    const operation = {
        tags: [tag],
        summary: `${method.toUpperCase()} ${path}`,
        responses: {
            200: { description: "Success" },
            400: { description: "Bad request" },
            401: { description: "Unauthorized" },
            500: { description: "Internal server error" },
        },
    };

    const params = getPathParameters(path);
    if (params.length) operation.parameters = params;

    if (["post", "put", "patch"].includes(lower) && !path.includes("/image/")) {
        operation.requestBody = {
            required: false,
            content: {
                "application/json": {
                    schema: {
                        type: "object",
                        additionalProperties: true,
                    },
                },
            },
        };
    }

    const security = inferSecurity(routeLayer);
    if (security) operation.security = security;

    return operation;
}

function buildAutoPaths() {
    const paths = {};
    for (const mount of routeMounts) {
        const stack = mount.router?.stack || [];
        for (const layer of stack) {
            if (!layer.route) continue;
            const routePath = layer.route.path;
            if (typeof routePath !== "string") continue;
            const fullPath = toFullPath(mount.prefix, routePath);
            if (!paths[fullPath]) paths[fullPath] = {};

            const methods = Object.keys(layer.route.methods || {}).filter((m) => layer.route.methods[m]);
            for (const method of methods) {
                paths[fullPath][method] = buildOperation({
                    method,
                    path: fullPath,
                    tag: mount.tag,
                    routeLayer: layer,
                });
            }
        }
    }
    return paths;
}

const autoPaths = buildAutoPaths();

const swaggerSpec = {
    openapi: "3.0.3",
    info: {
        title: "SmartRent API",
        version: "1.0.0",
        description: "API documentation for SmartRent Car backend",
    },
    servers: [{ url: baseUrl }],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
            },
        },
        schemas: {
            ApiMessage: {
                type: "object",
                properties: {
                    message: { type: "string" },
                    data: { type: "object", additionalProperties: true },
                },
            },
        },
    },
    tags: [
        { name: "System" },
        ...routeMounts.map((m) => ({ name: m.tag })),
        { name: "AI Inspection" },
    ],
    paths: {
        ...autoPaths,
        "/api/health": {
            get: {
                tags: ["System"],
                summary: "Health check",
                responses: {
                    200: {
                        description: "Service is healthy",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        ok: { type: "boolean", example: true },
                                        service: { type: "string", example: "smartrent-api" },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
        "/api/uploads/image/files": {
            post: {
                tags: ["Uploads"],
                summary: "Upload image files",
                requestBody: {
                    required: true,
                    content: {
                        "multipart/form-data": {
                            schema: {
                                type: "object",
                                properties: {
                                    files: {
                                        type: "array",
                                        items: { type: "string", format: "binary" },
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: "Uploaded successfully" },
                    422: { description: "Validation error" },
                },
            },
        },
        "/api/uploads/image/vehicle-damage": {
            post: {
                tags: ["AI Inspection"],
                summary: "Compare before/after vehicle images with AI",
                requestBody: {
                    required: true,
                    content: {
                        "multipart/form-data": {
                            schema: {
                                type: "object",
                                required: ["before_rental", "after_return"],
                                properties: {
                                    before_rental: { type: "string", format: "binary" },
                                    after_return: { type: "string", format: "binary" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: "AI analysis result",
                        content: {
                            "application/json": {
                                schema: {
                                    type: "object",
                                    properties: {
                                        message: { type: "string" },
                                        data: {
                                            type: "object",
                                            properties: {
                                                damage_detected: { type: "boolean" },
                                                severity: {
                                                    type: "string",
                                                    enum: ["none", "minor", "moderate", "severe"],
                                                },
                                                summary: { type: "string" },
                                                differences: {
                                                    type: "array",
                                                    items: {
                                                        type: "object",
                                                        properties: {
                                                            area: { type: "string" },
                                                            description: { type: "string" },
                                                            likely_new_damage: { type: "boolean" },
                                                        },
                                                    },
                                                },
                                                conclusion: { type: "string" },
                                                disclaimer: { type: "string" },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    422: { description: "Validation error" },
                    503: { description: "AI provider is not configured" },
                },
            },
        },
    },
};

module.exports = swaggerSpec;
