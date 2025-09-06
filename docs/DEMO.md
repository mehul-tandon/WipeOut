# Demo Guide

This guide provides step-by-step instructions for demonstrating the WipeOut MVP.

## Demo Overview

The demonstration showcases:
1. **Web Interface** - One-click secure wiping with OS detection
2. **Cross-Platform Tools** - Windows, Linux, and macOS executables
3. **Certificate Generation** - Tamper-proof digital certificates
4. **Certificate Verification** - Cryptographic validation system
5. **NIST Compliance** - Professional-grade data sanitization

## Pre-Demo Setup

### 1. Environment Preparation

```bash
# Clone and setup the project
git clone <repository-url>
cd secure-data-wiper
npm run install:all

# Start the development environment
npm run dev
```

### 2. Test Data Preparation

Create test files for demonstration:

```bash
# Create test files
mkdir demo-files
echo "Sensitive data that needs to be wiped" > demo-files/test1.txt
echo "Confidential information" > demo-files/test2.txt
dd if=/dev/zero of=demo-files/test-device.img bs=1M count=100  # 100MB test image
```

### 3. Browser Setup

Open multiple browser tabs:
- Frontend: http://localhost:3000
- API Health: http://localhost:3001/health
- Certificate Verification: http://localhost:3000/verify

## Demo Script

### Part 1: Web Interface Overview (5 minutes)

1. **Landing Page**
   - Show the professional interface
   - Highlight NIST SP 800-88 compliance
   - Demonstrate OS detection feature

2. **Navigation**
   - Tour the main sections: Home, Download, Verify, About
   - Explain the one-click approach

3. **Download Page**
   - Show platform-specific tools
   - Explain system requirements
   - Demonstrate download instructions

### Part 2: Core Engine Demonstration (10 minutes)

1. **Command Line Interface**
   ```bash
   cd core-engine
   python -m secure_wiper.main --help
   ```

2. **Device Detection**
   ```bash
   # List available devices (use test image)
   python -m secure_wiper.main list-devices
   ```

3. **Secure Wipe Simulation**
   ```bash
   # Wipe test image with NIST algorithm
   python -m secure_wiper.main wipe demo-files/test-device.img \
       --algorithm nist \
       --passes 3 \
       --verify \
       --output demo-report.json
   ```

4. **Report Analysis**
   ```bash
   # Show generated report
   cat demo-report.json | jq '.'
   
   # Verify report
   python -m secure_wiper.main verify-report demo-report.json
   ```

### Part 3: Certificate Generation (8 minutes)

1. **Automatic Certificate Creation**
   - Show how wipe completion triggers certificate generation
   - Explain the digital signing process
   - Display the generated PDF certificate

2. **Certificate Features**
   - QR code for verification
   - Tamper-evident design
   - Cryptographic signatures
   - Compliance information

3. **API Integration**
   ```bash
   # Submit wipe data via API
   curl -X POST http://localhost:3001/api/wipe/submit \
       -H "Content-Type: application/json" \
       -d @demo-report.json
   ```

### Part 4: Certificate Verification (7 minutes)

1. **Web-Based Verification**
   - Navigate to verification page
   - Enter certificate ID
   - Show verification results

2. **File Upload Verification**
   - Upload PDF certificate
   - Demonstrate integrity checking
   - Show detailed verification information

3. **API Verification**
   ```bash
   # Verify certificate via API
   curl http://localhost:3001/api/certificate/verify/CERTIFICATE_ID
   ```

### Part 5: Security Features (5 minutes)

1. **Cryptographic Security**
   - Explain KMS integration
   - Show signature validation
   - Demonstrate tamper detection

2. **Compliance Standards**
   - NIST SP 800-88 Rev. 1
   - DoD 5220.22-M
   - ISO 27001 alignment
   - GDPR compliance

3. **Audit Trail**
   - Show logging capabilities
   - Explain audit requirements
   - Demonstrate reporting features

## Demo Scenarios

### Scenario 1: Enterprise IT Department

**Context**: IT department needs to securely wipe decommissioned laptops

**Demo Flow**:
1. Show web interface for easy access
2. Download Windows executable
3. Demonstrate command-line usage
4. Generate compliance certificate
5. Verify certificate for audit purposes

### Scenario 2: Government Agency

**Context**: Government agency with classified data requirements

**Demo Flow**:
1. Emphasize NIST compliance
2. Show multiple algorithm options
3. Demonstrate verification process
4. Explain audit trail capabilities
5. Show certificate authenticity features

### Scenario 3: Healthcare Organization

**Context**: Hospital disposing of devices with patient data

**Demo Flow**:
1. Highlight HIPAA compliance aspects
2. Show cross-platform device wiping (Windows/Linux/macOS)
3. Demonstrate certificate generation
4. Explain legal protection benefits
5. Show verification for regulators

## Technical Deep Dive (Optional)

### Architecture Overview
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │  Core Engine    │
│   (React)       │◄──►│   (Node.js)     │◄──►│   (Python)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Cloud KMS     │
                       │  (AWS/GCP/Azure)│
                       └─────────────────┘
```

### Data Flow
1. User initiates wipe through web interface or CLI
2. Core engine performs NIST-compliant data erasure
3. Wipe results sent to backend API
4. Backend generates certificate using KMS
5. Certificate stored and made available for download
6. Verification system validates certificate authenticity

### Security Model
- **Encryption**: All communications use HTTPS/TLS
- **Authentication**: JWT-based API authentication
- **Signatures**: Cloud KMS digital signatures
- **Integrity**: SHA-256 hashing for tamper detection
- **Audit**: Comprehensive logging and monitoring

## Q&A Preparation

### Common Questions

**Q: How does this compare to built-in OS tools?**
A: Our solution provides:
- Standardized NIST compliance
- Tamper-proof certification
- Cross-platform consistency
- Legal audit trail
- Professional reporting

**Q: What about SSD wear leveling?**
A: We implement NIST Purge methods specifically designed for modern storage, including:
- Cryptographic erasure for SSDs
- Multiple pass verification
- Manufacturer-specific commands
- Compliance with latest standards

**Q: How secure are the certificates?**
A: Certificates use:
- Cloud KMS for key management
- RSA-2048 or higher encryption
- SHA-256 integrity checking
- Tamper-evident design
- Blockchain-style verification

**Q: Can this be integrated with existing systems?**
A: Yes, through:
- RESTful API integration
- Command-line automation
- Custom reporting formats
- Enterprise directory integration
- Workflow management systems

## Demo Tips

1. **Preparation**
   - Test all components beforehand
   - Have backup scenarios ready
   - Prepare for network issues
   - Keep demo files small for speed

2. **Presentation**
   - Start with business value
   - Show technical capabilities
   - Emphasize compliance benefits
   - Address security concerns

3. **Interaction**
   - Encourage questions
   - Provide hands-on opportunities
   - Share technical details when asked
   - Offer follow-up resources

## Follow-Up Resources

- **Documentation**: Complete API and user guides
- **Source Code**: GitHub repository access
- **Support**: Technical support contacts
- **Training**: Implementation assistance
- **Customization**: Enterprise feature development

## Demo Checklist

### Before Demo
- [ ] All services running
- [ ] Test data prepared
- [ ] Browser tabs open
- [ ] Network connectivity verified
- [ ] Backup scenarios ready

### During Demo
- [ ] Explain business context
- [ ] Show technical capabilities
- [ ] Demonstrate security features
- [ ] Address questions thoroughly
- [ ] Provide hands-on experience

### After Demo
- [ ] Provide contact information
- [ ] Share documentation links
- [ ] Schedule follow-up meetings
- [ ] Offer trial access
- [ ] Collect feedback

This demo guide ensures a comprehensive and professional presentation of the Secure Data Wiping Solution MVP, highlighting both technical capabilities and business value.
