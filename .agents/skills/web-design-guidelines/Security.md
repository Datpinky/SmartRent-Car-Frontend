# NPM Package Security Scanning

Whenever you add a new npm package to package.json, you MUST:

1. Run `npm install --package-lock-only` to update the package-lock.json file
2. Run `trivy fs --scanners vuln --severity HIGH,CRITICAL --exit-code 1 package-lock.json` to scan for vulnerabilities
3. If there are HIGH or CRITICAL vulnerabilities found:
   - Search for a newer version of the package that fixes the vulnerability
   - If no fixed version exists, search for and replace with an alternative package that provides similar functionality
   - Re-run the security scan after making changes to ensure vulnerabilities are resolved

This ensures all dependencies are scanned for security vulnerabilities before being added to the codebase.



# NPM Package License Verification

Whenever you add a new npm package to package.json, you MUST verify its license:

1. Check the package's license on npmjs.com or using `npm view <package-name> license`
2. Avoid packages with risky licenses including:
   - GPL (GPL-2.0, GPL-3.0) - Strong copyleft requirements
   - AGPL (AGPL-3.0) - Network copyleft requirements
   - Any "Non-Commercial" licenses
   - Proprietary or unlicensed packages
3. Prefer permissive licenses such as:
   - MIT
   - Apache-2.0
   - BSD (BSD-2-Clause, BSD-3-Clause)
   - ISC
4. After adding a new package, update the `open-source-licenses.txt` file with:
   - Package name
   - Version
   - License type
   - License URL or text location

If a package has a risky license, search for alternative packages with permissive licenses that provide similar functionality.

# Encryption

All data MUST be encrypted both at rest and in transit.

## Encryption in Transit

All network communication must use encryption:

1. **HTTPS/TLS**
   - Use TLS 1.2 or higher (prefer TLS 1.3)
   - Enforce HTTPS for all web traffic
   - Use HSTS headers to prevent downgrade attacks
   - Validate SSL/TLS certificates

2. **API Communication**
   - Use HTTPS for all API calls
   - Never transmit sensitive data over unencrypted connections
   - Validate server certificates

3. **Database Connections**
   - Enable SSL/TLS for database connections
   - Use encrypted connection strings
   - Verify server certificates

4. **Internal Service Communication**
   - Use TLS for service-to-service communication
   - Consider mutual TLS (mTLS) for service authentication

## Encryption at Rest

All stored data must be encrypted:

1. **Database Encryption**
   - Enable encryption at rest for databases (e.g., AWS RDS encryption, Azure SQL TDE)
   - Encrypt backups
   - Use encrypted volumes

2. **File Storage**
   - Enable server-side encryption for object storage (e.g., S3, Azure Blob)
   - Use encryption for file systems
   - Encrypt local storage and caches

3. **Secrets Management**
   - Never store secrets in plaintext
   - Use secret management services (AWS Secrets Manager, Azure Key Vault, HashiCorp Vault)
   - Encrypt environment variables containing sensitive data
   - Use encrypted configuration files

4. **Sensitive Data Fields**
   - Encrypt PII (Personally Identifiable Information)
   - Encrypt financial data
   - Encrypt authentication tokens and session data
   - Encrypt any data marked as "restricted" or "confidential"

## Key Management

1. **Use Strong Keys**
   - Minimum 256-bit keys for symmetric encryption (AES-256)
   - Minimum 2048-bit keys for asymmetric encryption (RSA-2048, prefer RSA-4096)
   - Prefer modern algorithms: AES-256-GCM, ChaCha20-Poly1305

2. **Key Rotation**
   - Rotate encryption keys regularly
   - Implement automatic key rotation where possible
   - Document key rotation procedures

3. **Key Storage**
   - Never hardcode encryption keys
   - Use cloud provider KMS (Key Management Service)
   - Separate key storage from encrypted data
   - Use HSM (Hardware Security Module) for high-security requirements

## Implementation Guidelines

1. **Use Proven Libraries**
   - Use well-established cryptography libraries
   - Don't implement custom encryption algorithms
   - Keep cryptographic libraries up to date

2. **Default to Encrypted**
   - Encryption should be the default, not an option
   - Fail securely if encryption cannot be established

3. **Verify Encryption**
   - Test that encryption is actually enabled
   - Monitor for unencrypted data transmission
   - Audit encryption configurations regularly

## What NOT to Do

- ❌ Never roll your own crypto
- ❌ Never store encryption keys with the encrypted data
- ❌ Never use weak algorithms (MD5, SHA1, DES, 3DES, RC4)
- ❌ Never transmit sensitive data over HTTP
- ❌ Never store passwords in plaintext (use bcrypt, argon2, or PBKDF2)
- ❌ Never commit secrets or keys to version control

# Audit Logging

When adding privileged functionality, ensure adequate audit coverage following the "Who did what when" principle.

## What to Audit

1. **Privileged Operations** - Actions that modify system state or user permissions
   - Admin adding/removing users
   - Role or permission changes
   - Configuration modifications
   - System setting changes

2. **Restricted Data Access** - Any interaction with data labeled as "restricted"
   - Viewing restricted documents
   - Downloading restricted files
   - Querying restricted data
   - Modifying restricted resources

3. **Not Everything Needs Auditing** - Use judgment for routine, non-sensitive operations

## Standard Log Format

Use this JSON format for all audit logs (written to stdout as single-line JSON):

```json
{
  "timestamp": "2025-11-13T14:23:45.123Z",
  "event_id": "evt_unique123",
  "event_type": "resource.action",
  "severity": "INFO|WARNING|ERROR|CRITICAL",
  "actor": {
    "id": "user-123",
    "type": "user|service_account|api_key|system",
    "name": "email or service name",
    "ip_address": "203.0.113.42"
  },
  "action": {
    "type": "CREATE|READ|UPDATE|DELETE|EXECUTE",
    "outcome": "success|failure|denied",
    "reason": "optional explanation"
  },
  "resource": {
    "id": "unique resource id",
    "type": "resource type",
    "name": "human readable name"
  },
  "context": {
    "environment": "dev|staging|production",
    "service": "service name"
  },
  "metadata": {}
}
```

## Event Type Naming

Use dot notation for event types:
- `auth.login.success` / `auth.login.failure`
- `user.create` / `user.delete` / `user.update`
- `resource.read` / `resource.update` / `resource.delete`
- `data.restricted.access`
- `infrastructure.change.applied`
- `compliance.access.denied`

## Requirements

- Always use UTC timestamps in ISO 8601 format
- Generate unique `event_id` for each log entry
- Include actor information for all actions
- Log both successes AND failures
- Add relevant metadata (changes made, ticket IDs, data classifications, etc.)
- Write to stdout as single-line JSON for log aggregation systems

# Data Classification Standard

When writing code that handles data, automatically classify it and apply appropriate controls.

## Classification Levels
 
### PUBLIC
Examples: product catalogs, public docs, marketing content
Controls: None required

### INTERNAL  
Examples: employee directories, internal metrics, roadmaps
Controls: Authentication required

### CONFIDENTIAL
Examples: contracts, financial reports, strategic plans  
Controls: Role-based access, audit logging required

### PII (Personally Identifiable Information)
Examples: emails, phone numbers, addresses, names, IP addresses, device IDs
Controls:
- Encrypt at rest and in transit
- Mask in logs: `user@example.com` → `u***@example.com`
- Audit all access
- GDPR/privacy compliance required

### PCI (Payment Card Industry)
Examples: credit card numbers, CVV, full PAN
Controls:
- **NEVER store raw card data**
- Use payment processor tokens only
- PCI-DSS compliance required

### PHI (Protected Health Information)
Examples: medical records, diagnoses, prescriptions, health data
Controls:
- Encrypt all PHI
- Audit every access
- HIPAA compliance required

## Code Requirements

**When handling classified data:**
1. Add comments marking data classification
2. Encrypt sensitive fields before storage
3. Mask sensitive data in logs (use IDs, not values)
4. Add audit logging for PII/PCI/PHI access
5. Apply data minimization (only collect what's needed)
6. Tag infrastructure resources with `DataClassification` tag

**Red flags to catch:**
- Logging PII/PCI/PHI values directly
- Storing credit card data
- Missing encryption for PII/PHI
- Sending sensitive data to analytics without anonymization
- Missing audit logs for sensitive operations
