const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, param, validationResult } = require('express-validator');

const logger = require('../utils/logger');
const certificateService = require('../services/certificateService');
const { validateCertificateVerification } = require('../utils/validation');

const router = express.Router();

// Configure multer for certificate uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10485760, // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || path.extname(file.originalname).toLowerCase() === '.pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// GET /api/certificate/download/:certificateId - Download certificate PDF
router.get('/download/:certificateId', [
  param('certificateId').isUUID().withMessage('Invalid certificate ID format')
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { certificateId } = req.params;
    const certificateDir = path.join(__dirname, '../../../certificates');
    const pdfPath = path.join(certificateDir, `${certificateId}.pdf`);
    const metadataPath = path.join(certificateDir, `${certificateId}.json`);

    // Check if certificate exists
    if (!fs.existsSync(pdfPath) || !fs.existsSync(metadataPath)) {
      return res.status(404).json({
        success: false,
        error: 'Certificate not found'
      });
    }

    // Get certificate metadata for filename
    const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
    const filename = `certificate-${metadata.wipeDetails.deviceId}-${certificateId.substring(0, 8)}.pdf`;

    // Log download
    logger.info('Certificate downloaded', {
      certificateId,
      deviceId: metadata.wipeDetails.deviceId,
      ip: req.ip
    });

    // Send file
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.sendFile(pdfPath);

  } catch (error) {
    logger.error('Certificate download failed', {
      certificateId: req.params.certificateId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/certificate/verify/:certificateId - Verify certificate by ID
router.get('/verify/:certificateId', [
  param('certificateId').isUUID().withMessage('Invalid certificate ID format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { certificateId } = req.params;
    
    logger.info('Certificate verification requested', {
      certificateId,
      ip: req.ip
    });

    const verificationResult = await certificateService.verifyCertificate(certificateId);

    if (!verificationResult.valid) {
      return res.status(400).json({
        success: false,
        error: 'Certificate verification failed',
        details: verificationResult.error
      });
    }

    // Return verification result without sensitive data
    const publicData = {
      certificateId,
      valid: true,
      verifiedAt: verificationResult.verifiedAt,
      wipeDetails: {
        deviceId: verificationResult.certificateData.wipeDetails.deviceId,
        algorithm: verificationResult.certificateData.wipeDetails.algorithm,
        passes: verificationResult.certificateData.wipeDetails.passes,
        status: verificationResult.certificateData.wipeDetails.status,
        startTime: verificationResult.certificateData.wipeDetails.startTime,
        endTime: verificationResult.certificateData.wipeDetails.endTime,
        duration: verificationResult.certificateData.wipeDetails.duration
      },
      issuer: verificationResult.certificateData.issuer,
      timestamp: verificationResult.certificateData.timestamp
    };

    res.status(200).json({
      success: true,
      message: 'Certificate is valid and verified',
      data: publicData
    });

  } catch (error) {
    logger.error('Certificate verification error', {
      certificateId: req.params.certificateId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// POST /api/certificate/verify - Verify certificate by upload
router.post('/verify', upload.single('certificate'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No certificate file uploaded'
      });
    }

    // For this demo, we'll extract the certificate ID from the filename or metadata
    // In a real implementation, you might extract it from the PDF content
    const { certificateId } = req.body;

    if (!certificateId) {
      return res.status(400).json({
        success: false,
        error: 'Certificate ID is required for verification'
      });
    }

    const validation = validateCertificateVerification({ certificateId });
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: validation.errors
      });
    }

    logger.info('Certificate file uploaded for verification', {
      certificateId,
      filename: req.file.originalname,
      size: req.file.size,
      ip: req.ip
    });

    const verificationResult = await certificateService.verifyCertificate(certificateId);

    if (!verificationResult.valid) {
      return res.status(400).json({
        success: false,
        error: 'Certificate verification failed',
        details: verificationResult.error
      });
    }

    res.status(200).json({
      success: true,
      message: 'Certificate is valid and verified',
      data: {
        certificateId,
        valid: true,
        verifiedAt: verificationResult.verifiedAt,
        filename: req.file.originalname
      }
    });

  } catch (error) {
    logger.error('Certificate upload verification error', {
      error: error.message,
      filename: req.file?.originalname
    });

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/certificate/public-key - Get public key for manual verification
router.get('/public-key', (req, res) => {
  try {
    const kmsService = require('../services/kmsService');
    const publicKey = kmsService.getPublicKey();

    res.status(200).json({
      success: true,
      data: {
        publicKey,
        algorithm: 'RSA-SHA256',
        format: 'PEM',
        usage: 'This public key can be used to manually verify certificate signatures'
      }
    });

  } catch (error) {
    logger.error('Public key retrieval error', {
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/certificate/list - List all certificates (admin endpoint)
router.get('/list', (req, res) => {
  try {
    // This would typically require authentication/authorization
    const certificateDir = path.join(__dirname, '../../../certificates');
    
    if (!fs.existsSync(certificateDir)) {
      return res.status(200).json({
        success: true,
        data: {
          certificates: [],
          total: 0
        }
      });
    }

    const files = fs.readdirSync(certificateDir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    const certificates = jsonFiles.map(file => {
      try {
        const metadata = JSON.parse(fs.readFileSync(path.join(certificateDir, file), 'utf8'));
        return {
          certificateId: metadata.certificateId,
          deviceId: metadata.wipeDetails.deviceId,
          status: metadata.wipeDetails.status,
          algorithm: metadata.wipeDetails.algorithm,
          timestamp: metadata.timestamp,
          issuer: metadata.issuer
        };
      } catch (error) {
        logger.error('Error reading certificate metadata', {
          file,
          error: error.message
        });
        return null;
      }
    }).filter(cert => cert !== null);

    res.status(200).json({
      success: true,
      data: {
        certificates,
        total: certificates.length
      }
    });

  } catch (error) {
    logger.error('Certificate list error', {
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;
