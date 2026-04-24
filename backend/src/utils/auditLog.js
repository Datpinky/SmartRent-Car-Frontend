const crypto = require('crypto');

/**
 * Ghi log kiểu audit một dòng JSON (stdout) — căn chỉnh hướng dẫn Security.md.
 * @param {object} params
 */
function auditLog({ event_type, severity = 'INFO', actor, action, resource, metadata = {} }) {
  const line = JSON.stringify({
    timestamp: new Date().toISOString(),
    event_id: `evt_${crypto.randomUUID()}`,
    event_type,
    severity,
    actor: actor || {},
    action: action || {},
    resource: resource || {},
    context: {
      environment: process.env.NODE_ENV || 'development',
      service: 'smartrent-api',
    },
    metadata,
  });
  // eslint-disable-next-line no-console
  console.log(line);
}

module.exports = { auditLog };
