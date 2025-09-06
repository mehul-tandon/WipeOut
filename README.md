# WipeOut - Secure Data Wiping Solution MVP

A comprehensive full-stack solution for secure data erasure with NIST SP 800-88 compliance and tamper-proof certification.

## Architecture Overview

```
secure-data-wiper/
├── frontend/          # React.js + Tailwind CSS web application
├── backend/           # Node.js + Express API server
├── core-engine/       # Python cross-platform wiping tool
├── certificates/      # Certificate generation and verification
├── build-scripts/     # Cross-platform build automation
└── docs/             # Documentation and deployment guides
```

## Features

### Frontend (React.js + Tailwind CSS)
- Responsive one-click interface
- Automatic OS detection (Windows, Linux, macOS)
- Download prompts for appropriate wiping tools
- Certificate verification interface
- Real-time status updates

### Backend (Node.js + Express)
- RESTful API for wipe result processing
- Certificate generation and signing
- Cloud KMS integration for secure key management
- Certificate verification endpoints
- Static file serving for frontend and tools

### Core Wiping Engine (Python)
- Cross-platform CLI tool (Windows, Linux, macOS)
- NIST SP 800-88 compliant data erasure
- Multiple wiping algorithms (DoD 5220.22-M, Gutmann, etc.)
- JSON reporting with device metadata
- Automatic API communication for result submission

### Certificate System
- Tamper-proof PDF certificate generation
- Digital signatures using cloud KMS
- QR codes for easy verification
- Blockchain-style verification chain
- Public key verification endpoints

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   cd frontend && npm install
   cd ../backend && npm install
   cd ../core-engine && pip install -r requirements.txt
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your KMS and API configurations
   ```

3. **Start Development**
   ```bash
   npm run dev  # Starts all services concurrently
   ```

4. **Build for Production**
   ```bash
   npm run build:all  # Builds all components
   ```

## Security Features

- End-to-end encryption for all communications
- Cloud KMS for certificate signing keys
- Tamper-evident certificate generation
- Cryptographic verification of wipe completion
- Audit trail for all operations

## Compliance

- NIST SP 800-88 Rev. 1 compliant data sanitization
- DoD 5220.22-M standard support
- GDPR right-to-erasure compliance
- ISO 27001 security controls alignment

## Deployment

The solution can be deployed as:
- Self-hosted on-premises installation
- Cloud-based SaaS offering
- Hybrid deployment with local tools and cloud certificates

## License

MIT License - See LICENSE file for details
