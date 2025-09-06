const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const logger = require('../utils/logger');
const certificateService = require('../services/certificateService');
const { validateWipeData } = require('../utils/validation');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760, // 10MB default
  },
  fileFilter: (req, file, cb) => {
    // Allow JSON files for wipe reports
    if (file.mimetype === 'application/json' || path.extname(file.originalname).toLowerCase() === '.json') {
      cb(null, true);
    } else {
      cb(new Error('Only JSON files are allowed'), false);
    }
  }
});

// POST /api/wipe/submit - Submit wipe results
router.post('/submit', [
  body('deviceId').notEmpty().withMessage('Device ID is required'),
  body('serialNumber').notEmpty().withMessage('Serial number is required'),
  body('algorithm').isIn(['nist', 'dod', 'gutmann', 'random']).withMessage('Invalid algorithm'),
  body('passes').isInt({ min: 1, max: 35 }).withMessage('Passes must be between 1 and 35'),
  body('startTime').isISO8601().withMessage('Invalid start time format'),
  body('endTime').isISO8601().withMessage('Invalid end time format'),
  body('status').isIn(['success', 'failed', 'partial']).withMessage('Invalid status'),
  body('verification').optional().isBoolean(),
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const wipeData = req.body;
    
    // Add server-side metadata
    wipeData.submissionId = uuidv4();
    wipeData.submissionTime = new Date().toISOString();
    wipeData.serverVersion = process.env.npm_package_version || '1.0.0';
    wipeData.ipAddress = req.ip;

    // Validate wipe data integrity
    const validationResult = validateWipeData(wipeData);
    if (!validationResult.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid wipe data',
        details: validationResult.errors
      });
    }

    // Log the wipe submission
    logger.info('Wipe submission received', {
      submissionId: wipeData.submissionId,
      deviceId: wipeData.deviceId,
      status: wipeData.status,
      algorithm: wipeData.algorithm
    });

    // Generate certificate if wipe was successful
    let certificateData = null;
    if (wipeData.status === 'success') {
      try {
        certificateData = await certificateService.generateCertificate(wipeData);
        logger.info('Certificate generated successfully', {
          submissionId: wipeData.submissionId,
          certificateId: certificateData.certificateId
        });
      } catch (certError) {
        logger.error('Certificate generation failed', {
          submissionId: wipeData.submissionId,
          error: certError.message
        });
        // Don't fail the entire request if certificate generation fails
        certificateData = { error: 'Certificate generation failed' };
      }
    }

    // Store wipe data (in production, this would go to a database)
    const dataFile = path.join(__dirname, '../../../uploads', `wipe-${wipeData.submissionId}.json`);
    fs.writeFileSync(dataFile, JSON.stringify(wipeData, null, 2));

    res.status(200).json({
      success: true,
      message: 'Wipe data submitted successfully',
      data: {
        submissionId: wipeData.submissionId,
        status: wipeData.status,
        certificate: certificateData
      }
    });

  } catch (error) {
    logger.error('Error processing wipe submission', {
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to process wipe submission'
    });
  }
});

// POST /api/wipe/upload - Upload wipe report file
router.post('/upload', upload.single('wipeReport'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    // Read and parse the uploaded JSON file
    const filePath = req.file.path;
    const fileContent = fs.readFileSync(filePath, 'utf8');
    let wipeData;

    try {
      wipeData = JSON.parse(fileContent);
    } catch (parseError) {
      // Clean up the uploaded file
      fs.unlinkSync(filePath);
      return res.status(400).json({
        success: false,
        error: 'Invalid JSON format'
      });
    }

    // Validate the wipe data
    const validationResult = validateWipeData(wipeData);
    if (!validationResult.isValid) {
      fs.unlinkSync(filePath);
      return res.status(400).json({
        success: false,
        error: 'Invalid wipe data format',
        details: validationResult.errors
      });
    }

    // Process the wipe data (similar to submit endpoint)
    wipeData.submissionId = uuidv4();
    wipeData.submissionTime = new Date().toISOString();
    wipeData.uploadedFile = req.file.filename;

    logger.info('Wipe report uploaded', {
      submissionId: wipeData.submissionId,
      filename: req.file.filename,
      deviceId: wipeData.deviceId
    });

    // Generate certificate if applicable
    let certificateData = null;
    if (wipeData.status === 'success') {
      try {
        certificateData = await certificateService.generateCertificate(wipeData);
      } catch (certError) {
        logger.error('Certificate generation failed for uploaded report', {
          submissionId: wipeData.submissionId,
          error: certError.message
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Wipe report processed successfully',
      data: {
        submissionId: wipeData.submissionId,
        filename: req.file.filename,
        certificate: certificateData
      }
    });

  } catch (error) {
    logger.error('Error processing uploaded wipe report', {
      error: error.message,
      stack: error.stack
    });

    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to process uploaded wipe report'
    });
  }
});

// GET /api/wipe/status/:submissionId - Get wipe status
router.get('/status/:submissionId', (req, res) => {
  try {
    const { submissionId } = req.params;
    
    // In production, this would query a database
    const dataFile = path.join(__dirname, '../../../uploads', `wipe-${submissionId}.json`);
    
    if (!fs.existsSync(dataFile)) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found'
      });
    }

    const wipeData = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
    
    res.status(200).json({
      success: true,
      data: {
        submissionId: wipeData.submissionId,
        status: wipeData.status,
        deviceId: wipeData.deviceId,
        submissionTime: wipeData.submissionTime,
        algorithm: wipeData.algorithm,
        passes: wipeData.passes
      }
    });

  } catch (error) {
    logger.error('Error retrieving wipe status', {
      submissionId: req.params.submissionId,
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;
