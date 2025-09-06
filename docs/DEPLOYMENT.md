# Deployment Guide

This guide covers deploying the WipeOut MVP in various environments.

## Prerequisites

### System Requirements

**Backend Server:**
- Node.js 16.0 or later
- 4GB RAM minimum, 8GB recommended
- 50GB disk space for logs and certificates
- Linux/Windows/macOS

**Database (Optional):**
- PostgreSQL 12+ (for production audit logs)
- Redis (for session management)

**Cloud Services:**
- AWS KMS, Google Cloud KMS, or Azure Key Vault
- SSL certificate for HTTPS

## Quick Start (Development)

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd secure-data-wiper
   npm run install:all
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start Development Servers**
   ```bash
   npm run dev
   ```

4. **Access Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Health Check: http://localhost:3001/health

## Production Deployment

### Option 1: Docker Deployment

1. **Build Docker Images**
   ```bash
   docker-compose build
   ```

2. **Start Services**
   ```bash
   docker-compose up -d
   ```

3. **Configure Reverse Proxy**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       return 301 https://$server_name$request_uri;
   }

   server {
       listen 443 ssl;
       server_name yourdomain.com;
       
       ssl_certificate /path/to/cert.pem;
       ssl_certificate_key /path/to/key.pem;
       
       location / {
           proxy_pass http://localhost:3001;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

### Option 2: Manual Deployment

1. **Backend Deployment**
   ```bash
   cd backend
   npm install --production
   npm run build
   
   # Using PM2 for process management
   npm install -g pm2
   pm2 start src/server.js --name "secure-wiper-api"
   pm2 startup
   pm2 save
   ```

2. **Frontend Deployment**
   ```bash
   cd frontend
   npm install
   npm run build
   
   # Serve with nginx or copy to backend public directory
   cp -r build/* ../backend/public/
   ```

3. **Core Engine Distribution**
   ```bash
   # Build all platform executables
   npm run build:all
   
   # Files will be in downloads/ directory
   ls downloads/
   ```

## Environment Configuration

### Backend Environment Variables

```bash
# Server Configuration
NODE_ENV=production
PORT=3001
API_BASE_URL=https://yourdomain.com

# Database (Optional)
DATABASE_URL=postgresql://user:password@localhost:5432/secure_wiper

# Cloud KMS Configuration
# Choose one of the following:

# AWS KMS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
KMS_KEY_ID=your_kms_key_id

# Google Cloud KMS
GOOGLE_CLOUD_PROJECT=your_project_id
GOOGLE_CLOUD_KEY_FILE=path/to/service-account.json
GCP_KMS_KEY_RING=your_key_ring
GCP_KMS_KEY=your_key_name

# Azure Key Vault
AZURE_CLIENT_ID=your_client_id
AZURE_CLIENT_SECRET=your_client_secret
AZURE_TENANT_ID=your_tenant_id
AZURE_KEY_VAULT_URL=https://your-vault.vault.azure.net/

# Security
JWT_SECRET=your_jwt_secret_key_here
ENCRYPTION_KEY=your_32_character_encryption_key
API_RATE_LIMIT=100

# Certificate Configuration
CERT_ISSUER_NAME=Your Organization Name
CERT_VALIDITY_DAYS=365
```

### Frontend Environment Variables

```bash
REACT_APP_API_URL=https://yourdomain.com
REACT_APP_ENVIRONMENT=production
```

## Cloud KMS Setup

### AWS KMS

1. **Create KMS Key**
   ```bash
   aws kms create-key \
       --description "Secure Wiper Certificate Signing Key" \
       --key-usage SIGN_VERIFY \
       --key-spec RSA_2048
   ```

2. **Create Key Alias**
   ```bash
   aws kms create-alias \
       --alias-name alias/secure-wiper-signing \
       --target-key-id <key-id>
   ```

### Google Cloud KMS

1. **Create Key Ring**
   ```bash
   gcloud kms keyrings create secure-wiper \
       --location=global
   ```

2. **Create Signing Key**
   ```bash
   gcloud kms keys create signing-key \
       --location=global \
       --keyring=secure-wiper \
       --purpose=asymmetric-signing \
       --default-algorithm=rsa-sign-pkcs1-2048-sha256
   ```

### Azure Key Vault

1. **Create Key Vault**
   ```bash
   az keyvault create \
       --name secure-wiper-vault \
       --resource-group myResourceGroup \
       --location eastus
   ```

2. **Create Signing Key**
   ```bash
   az keyvault key create \
       --vault-name secure-wiper-vault \
       --name signing-key \
       --kty RSA \
       --size 2048
   ```

## SSL/TLS Configuration

### Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Self-Signed Certificate (Development)

```bash
# Generate private key
openssl genrsa -out server.key 2048

# Generate certificate
openssl req -new -x509 -key server.key -out server.crt -days 365
```

## Database Setup (Optional)

### PostgreSQL

```sql
-- Create database
CREATE DATABASE secure_wiper;

-- Create user
CREATE USER secure_wiper_user WITH PASSWORD 'your_password';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE secure_wiper TO secure_wiper_user;

-- Create tables (if using database for audit logs)
\c secure_wiper;

CREATE TABLE wipe_submissions (
    id SERIAL PRIMARY KEY,
    submission_id UUID UNIQUE NOT NULL,
    device_id VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    algorithm VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data JSONB
);

CREATE TABLE certificates (
    id SERIAL PRIMARY KEY,
    certificate_id UUID UNIQUE NOT NULL,
    submission_id UUID REFERENCES wipe_submissions(submission_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data JSONB
);
```

## Monitoring and Logging

### Log Configuration

```bash
# Create log directories
sudo mkdir -p /var/log/secure-wiper
sudo chown $USER:$USER /var/log/secure-wiper

# Configure log rotation
sudo tee /etc/logrotate.d/secure-wiper << EOF
/var/log/secure-wiper/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
}
EOF
```

### Health Monitoring

```bash
# Simple health check script
#!/bin/bash
curl -f http://localhost:3001/health || exit 1
```

## Security Considerations

1. **Network Security**
   - Use HTTPS only in production
   - Configure firewall rules
   - Use VPN for admin access

2. **Key Management**
   - Rotate KMS keys regularly
   - Use separate keys for different environments
   - Monitor key usage

3. **Access Control**
   - Implement proper authentication
   - Use role-based access control
   - Audit all administrative actions

4. **Data Protection**
   - Encrypt sensitive data at rest
   - Use secure communication channels
   - Implement proper backup procedures

## Backup and Recovery

### Database Backup

```bash
# PostgreSQL backup
pg_dump -U secure_wiper_user -h localhost secure_wiper > backup.sql

# Restore
psql -U secure_wiper_user -h localhost secure_wiper < backup.sql
```

### Certificate Backup

```bash
# Backup certificates directory
tar -czf certificates-backup-$(date +%Y%m%d).tar.gz certificates/

# Backup to cloud storage
aws s3 cp certificates-backup-$(date +%Y%m%d).tar.gz s3://your-backup-bucket/
```

## Troubleshooting

### Common Issues

1. **KMS Connection Errors**
   - Check credentials and permissions
   - Verify network connectivity
   - Check key policies

2. **Certificate Generation Failures**
   - Verify KMS key permissions
   - Check disk space
   - Review error logs

3. **Frontend Build Issues**
   - Clear node_modules and reinstall
   - Check Node.js version compatibility
   - Verify environment variables

### Log Locations

- Backend logs: `/var/log/secure-wiper/` or `logs/`
- Frontend build logs: `frontend/build.log`
- Core engine logs: User-specified or current directory

## Performance Optimization

1. **Backend Optimization**
   - Enable gzip compression
   - Use Redis for session storage
   - Implement connection pooling

2. **Frontend Optimization**
   - Enable service worker caching
   - Optimize bundle size
   - Use CDN for static assets

3. **Database Optimization**
   - Create appropriate indexes
   - Configure connection pooling
   - Regular maintenance tasks

## Scaling Considerations

1. **Horizontal Scaling**
   - Use load balancer
   - Stateless backend design
   - Shared certificate storage

2. **Vertical Scaling**
   - Monitor resource usage
   - Scale based on demand
   - Optimize memory usage

This deployment guide provides a comprehensive overview of deploying the Secure Data Wiping Solution. Adjust configurations based on your specific requirements and environment.
