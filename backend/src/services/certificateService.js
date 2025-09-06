const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

const logger = require('../utils/logger');
const kmsService = require('./kmsService');

class CertificateService {
  constructor() {
    this.certificateDir = path.join(__dirname, '../../../certificates');
    this.ensureCertificateDirectory();
  }

  ensureCertificateDirectory() {
    if (!fs.existsSync(this.certificateDir)) {
      fs.mkdirSync(this.certificateDir, { recursive: true });
    }
  }

  async generateCertificate(wipeData) {
    try {
      const certificateId = uuidv4();
      const timestamp = new Date().toISOString();
      
      // Create certificate data
      const certificateData = {
        certificateId,
        timestamp,
        version: '1.0',
        issuer: process.env.CERT_ISSUER_NAME || 'Secure Data Solutions',
        wipeDetails: {
          deviceId: wipeData.deviceId,
          serialNumber: wipeData.serialNumber,
          algorithm: wipeData.algorithm,
          passes: wipeData.passes,
          startTime: wipeData.startTime,
          endTime: wipeData.endTime,
          duration: this.calculateDuration(wipeData.startTime, wipeData.endTime),
          status: wipeData.status,
          verification: wipeData.verification || false,
          submissionId: wipeData.submissionId
        },
        metadata: {
          serverVersion: wipeData.serverVersion,
          coreEngineVersion: wipeData.coreEngineVersion || 'Unknown',
          submissionTime: wipeData.submissionTime,
          ipAddress: wipeData.ipAddress
        }
      };

      // Generate hash of certificate data for integrity
      const dataHash = this.generateDataHash(certificateData);
      certificateData.dataHash = dataHash;

      // Sign the certificate using KMS
      const signature = await kmsService.signData(JSON.stringify(certificateData));
      certificateData.signature = signature;

      // Generate QR code for verification
      const verificationUrl = `${process.env.API_BASE_URL}/api/certificate/verify/${certificateId}`;
      const qrCodeDataUrl = await QRCode.toDataURL(verificationUrl);

      // Generate PDF certificate
      const pdfPath = await this.generatePDF(certificateData, qrCodeDataUrl);

      // Store certificate metadata
      const metadataPath = path.join(this.certificateDir, `${certificateId}.json`);
      fs.writeFileSync(metadataPath, JSON.stringify(certificateData, null, 2));

      logger.info('Certificate generated successfully', {
        certificateId,
        deviceId: wipeData.deviceId,
        pdfPath
      });

      return {
        certificateId,
        pdfPath,
        downloadUrl: `/api/certificate/download/${certificateId}`,
        verificationUrl,
        signature,
        dataHash
      };

    } catch (error) {
      logger.error('Certificate generation failed', {
        error: error.message,
        stack: error.stack,
        deviceId: wipeData.deviceId
      });
      throw new Error(`Certificate generation failed: ${error.message}`);
    }
  }

  async generatePDF(certificateData, qrCodeDataUrl) {
    return new Promise((resolve, reject) => {
      try {
        const pdfPath = path.join(this.certificateDir, `${certificateData.certificateId}.pdf`);
        const doc = new PDFDocument({ margin: 50 });
        const stream = fs.createWriteStream(pdfPath);
        
        doc.pipe(stream);

        // Header
        doc.fontSize(24)
           .font('Helvetica-Bold')
           .text('SECURE DATA ERASURE CERTIFICATE', { align: 'center' })
           .moveDown();

        // Certificate ID and timestamp
        doc.fontSize(12)
           .font('Helvetica')
           .text(`Certificate ID: ${certificateData.certificateId}`)
           .text(`Issued: ${moment(certificateData.timestamp).format('MMMM Do YYYY, h:mm:ss A')}`)
           .text(`Issuer: ${certificateData.issuer}`)
           .moveDown();

        // Wipe details section
        doc.fontSize(16)
           .font('Helvetica-Bold')
           .text('WIPE DETAILS', { underline: true })
           .moveDown(0.5);

        doc.fontSize(12)
           .font('Helvetica')
           .text(`Device ID: ${certificateData.wipeDetails.deviceId}`)
           .text(`Serial Number: ${certificateData.wipeDetails.serialNumber}`)
           .text(`Algorithm: ${certificateData.wipeDetails.algorithm.toUpperCase()}`)
           .text(`Number of Passes: ${certificateData.wipeDetails.passes}`)
           .text(`Start Time: ${moment(certificateData.wipeDetails.startTime).format('MMMM Do YYYY, h:mm:ss A')}`)
           .text(`End Time: ${moment(certificateData.wipeDetails.endTime).format('MMMM Do YYYY, h:mm:ss A')}`)
           .text(`Duration: ${certificateData.wipeDetails.duration}`)
           .text(`Status: ${certificateData.wipeDetails.status.toUpperCase()}`)
           .text(`Verification: ${certificateData.wipeDetails.verification ? 'PASSED' : 'NOT PERFORMED'}`)
           .moveDown();

        // Compliance section
        doc.fontSize(16)
           .font('Helvetica-Bold')
           .text('COMPLIANCE STANDARDS', { underline: true })
           .moveDown(0.5);

        doc.fontSize(12)
           .font('Helvetica')
           .text('• NIST SP 800-88 Rev. 1 - Guidelines for Media Sanitization')
           .text('• DoD 5220.22-M - Data Sanitization Standard')
           .text('• ISO 27001 - Information Security Management')
           .moveDown();

        // Security section
        doc.fontSize(16)
           .font('Helvetica-Bold')
           .text('SECURITY VERIFICATION', { underline: true })
           .moveDown(0.5);

        doc.fontSize(10)
           .font('Helvetica')
           .text(`Data Hash: ${certificateData.dataHash}`)
           .text(`Digital Signature: ${certificateData.signature.substring(0, 64)}...`)
           .moveDown();

        // QR Code
        if (qrCodeDataUrl) {
          const qrImage = Buffer.from(qrCodeDataUrl.split(',')[1], 'base64');
          doc.image(qrImage, doc.page.width - 150, doc.y, { width: 100 });
          doc.text('Scan to verify certificate', doc.page.width - 150, doc.y + 110, { width: 100, align: 'center' });
        }

        // Footer
        doc.fontSize(8)
           .font('Helvetica')
           .text('This certificate is digitally signed and tamper-evident. Any modifications will invalidate the signature.', 
                 50, doc.page.height - 100, { align: 'center', width: doc.page.width - 100 });

        doc.end();

        stream.on('finish', () => {
          resolve(pdfPath);
        });

        stream.on('error', (error) => {
          reject(error);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  calculateDuration(startTime, endTime) {
    const start = moment(startTime);
    const end = moment(endTime);
    const duration = moment.duration(end.diff(start));
    
    const hours = Math.floor(duration.asHours());
    const minutes = duration.minutes();
    const seconds = duration.seconds();
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  generateDataHash(data) {
    const dataString = JSON.stringify(data, Object.keys(data).sort());
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  async verifyCertificate(certificateId) {
    try {
      const metadataPath = path.join(this.certificateDir, `${certificateId}.json`);
      
      if (!fs.existsSync(metadataPath)) {
        return { valid: false, error: 'Certificate not found' };
      }

      const certificateData = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      
      // Verify signature
      const dataToVerify = { ...certificateData };
      delete dataToVerify.signature;
      
      const isSignatureValid = await kmsService.verifySignature(
        JSON.stringify(dataToVerify),
        certificateData.signature
      );

      if (!isSignatureValid) {
        return { valid: false, error: 'Invalid signature' };
      }

      // Verify data hash
      const currentHash = this.generateDataHash(dataToVerify);
      if (currentHash !== certificateData.dataHash) {
        return { valid: false, error: 'Data integrity check failed' };
      }

      return {
        valid: true,
        certificateData,
        verifiedAt: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Certificate verification failed', {
        certificateId,
        error: error.message
      });
      return { valid: false, error: 'Verification failed' };
    }
  }
}

module.exports = new CertificateService();
