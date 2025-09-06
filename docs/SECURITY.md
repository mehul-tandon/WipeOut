# Security Configuration Guide

This document outlines the security configuration requirements for the WipeOut application.

## Environment Variables

**IMPORTANT**: Never commit passwords, secrets, or sensitive configuration to version control. Always use environment variables for sensitive data.

### Required Environment Variables

Before deploying the application, you must set the following environment variables:

#### Database Security
```bash
# PostgreSQL password - use a strong, unique password
POSTGRES_PASSWORD=your_secure_postgres_password_here

# Database connection string
DATABASE_URL=postgresql://secure_wiper:${POSTGRES_PASSWORD}@postgres:5432/secure_wiper
```

#### Redis Security
```bash
# Redis password - use a strong, unique password
REDIS_PASSWORD=your_secure_redis_password_here
```

#### Application Security
```bash
# JWT secret for token signing - minimum 32 characters
JWT_SECRET=your_jwt_secret_key_here_minimum_32_characters

# Encryption key for sensitive data - exactly 32 characters
ENCRYPTION_KEY=your_32_character_encryption_key_here

# Admin user password hash (generate with bcrypt)
# Generate with: node -e "console.log(require('bcryptjs').hashSync('your_password', 10))"
ADMIN_PASSWORD_HASH=your_bcrypt_hashed_admin_password
```

#### Monitoring Security (Optional)
```bash
# Grafana admin password
GRAFANA_ADMIN_PASSWORD=your_secure_grafana_password
```

## Password Requirements

All passwords should meet the following criteria:
- Minimum 16 characters long
- Include uppercase and lowercase letters
- Include numbers and special characters
- Unique for each service
- Not based on dictionary words

## Deployment Security

### Docker Compose Deployment

1. **Create a `.env` file** (never commit this file):
```bash
cp .env.example .env
```

2. **Edit the `.env` file** with your secure passwords:
```bash
# Example secure configuration
POSTGRES_PASSWORD=MySecureP@ssw0rd2024!
REDIS_PASSWORD=R3d1sS3cur3P@ss2024!
JWT_SECRET=MyVeryLongAndSecureJWTSecretKey2024!
ENCRYPTION_KEY=MySecure32CharacterEncryptionKey!
GRAFANA_ADMIN_PASSWORD=Gr@f@n@Adm1nP@ss2024!
```

3. **Set proper file permissions**:
```bash
chmod 600 .env
```

### Production Deployment

For production deployments, consider using:
- **AWS Secrets Manager** for AWS deployments
- **Azure Key Vault** for Azure deployments
- **Google Secret Manager** for GCP deployments
- **HashiCorp Vault** for on-premises deployments

## Cloud KMS Configuration

The application supports multiple cloud KMS providers for certificate signing:

### AWS KMS
```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
KMS_KEY_ID=your_kms_key_id
```

### Google Cloud KMS
```bash
GOOGLE_CLOUD_PROJECT=your_project_id
GOOGLE_CLOUD_KEY_FILE=path/to/service-account.json
GCP_KMS_KEY_RING=your_key_ring
GCP_KMS_KEY=your_key_name
GCP_KMS_LOCATION=global
```

### Azure Key Vault
```bash
AZURE_CLIENT_ID=your_client_id
AZURE_CLIENT_SECRET=your_client_secret
AZURE_TENANT_ID=your_tenant_id
AZURE_VAULT_URL=https://your-vault.vault.azure.net/
AZURE_KEY_NAME=your_key_name
```

## Network Security

### HTTPS Configuration

Always use HTTPS in production:
1. Obtain SSL certificates from a trusted CA
2. Configure nginx with proper SSL settings
3. Enable HSTS headers
4. Use secure cipher suites

### Firewall Configuration

Recommended firewall rules:
- Allow port 80 (HTTP) for redirect to HTTPS
- Allow port 443 (HTTPS) for web traffic
- Block direct access to database ports (5432, 6379)
- Block direct access to application ports (3001)

## Security Monitoring

### Log Security Events

The application logs security-relevant events:
- Authentication attempts
- Certificate generation requests
- Data wiping operations
- API access patterns

### Regular Security Updates

1. **Update dependencies regularly**:
```bash
npm audit
npm update
```

2. **Monitor security advisories** for:
   - Node.js runtime
   - React framework
   - Python dependencies
   - Docker base images

3. **Scan for vulnerabilities**:
```bash
# Node.js security scan
npm audit

# Python security scan
pip-audit

# Docker image scanning
docker scan wipeout-backend:latest
```

## Incident Response

In case of a security incident:

1. **Immediate Actions**:
   - Rotate all passwords and secrets
   - Review access logs
   - Isolate affected systems

2. **Investigation**:
   - Analyze log files
   - Check for unauthorized access
   - Assess data exposure

3. **Recovery**:
   - Apply security patches
   - Update configurations
   - Restore from clean backups if needed

## Compliance Considerations

### NIST SP 800-88 Compliance

The application implements NIST SP 800-88 guidelines for:
- Secure data sanitization
- Certificate generation
- Audit trail maintenance

### GDPR Compliance

For GDPR compliance:
- Implement data retention policies
- Provide data export capabilities
- Maintain processing records
- Ensure right to erasure

### HIPAA Compliance

For healthcare environments:
- Enable audit logging
- Implement access controls
- Use encryption at rest and in transit
- Maintain business associate agreements

## Contact

For security issues or questions:
- Create a private security issue in the repository
- Follow responsible disclosure practices
- Do not publicly disclose vulnerabilities

---

**Remember**: Security is an ongoing process, not a one-time setup. Regularly review and update your security configuration.
