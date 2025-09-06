const Joi = require('joi');

// Schema for wipe data validation
const wipeDataSchema = Joi.object({
  deviceId: Joi.string().required().min(1).max(100),
  serialNumber: Joi.string().required().min(1).max(100),
  algorithm: Joi.string().valid('nist', 'dod', 'gutmann', 'random').required(),
  passes: Joi.number().integer().min(1).max(35).required(),
  startTime: Joi.string().isoDate().required(),
  endTime: Joi.string().isoDate().required(),
  status: Joi.string().valid('success', 'failed', 'partial').required(),
  verification: Joi.boolean().optional(),
  
  // Optional fields that may be added by the system
  submissionId: Joi.string().uuid().optional(),
  submissionTime: Joi.string().isoDate().optional(),
  serverVersion: Joi.string().optional(),
  coreEngineVersion: Joi.string().optional(),
  ipAddress: Joi.string().ip().optional(),
  uploadedFile: Joi.string().optional(),
  
  // Device information (optional)
  deviceInfo: Joi.object({
    manufacturer: Joi.string().optional(),
    model: Joi.string().optional(),
    capacity: Joi.string().optional(),
    interface: Joi.string().optional(),
    firmware: Joi.string().optional()
  }).optional(),
  
  // Wipe details (optional)
  wipeDetails: Joi.object({
    sectorsWiped: Joi.number().integer().min(0).optional(),
    totalSectors: Joi.number().integer().min(0).optional(),
    bytesWiped: Joi.number().integer().min(0).optional(),
    totalBytes: Joi.number().integer().min(0).optional(),
    errorCount: Joi.number().integer().min(0).optional(),
    warnings: Joi.array().items(Joi.string()).optional()
  }).optional(),
  
  // Environment information (optional)
  environment: Joi.object({
    os: Joi.string().optional(),
    osVersion: Joi.string().optional(),
    architecture: Joi.string().optional(),
    hostname: Joi.string().optional(),
    username: Joi.string().optional()
  }).optional()
});

// Schema for certificate verification
const certificateVerificationSchema = Joi.object({
  certificateId: Joi.string().uuid().required(),
  signature: Joi.string().optional(),
  expectedHash: Joi.string().optional()
});

// Schema for file upload validation
const fileUploadSchema = Joi.object({
  filename: Joi.string().required(),
  mimetype: Joi.string().valid('application/json').required(),
  size: Joi.number().max(10485760).required() // 10MB max
});

/**
 * Validate wipe data against the schema
 * @param {Object} data - The wipe data to validate
 * @returns {Object} - Validation result with isValid boolean and errors array
 */
function validateWipeData(data) {
  const { error, value } = wipeDataSchema.validate(data, { 
    abortEarly: false,
    allowUnknown: true,
    stripUnknown: false
  });

  if (error) {
    return {
      isValid: false,
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context.value
      })),
      data: null
    };
  }

  // Additional business logic validation
  const businessValidation = validateBusinessRules(value);
  if (!businessValidation.isValid) {
    return businessValidation;
  }

  return {
    isValid: true,
    errors: [],
    data: value
  };
}

/**
 * Validate business rules for wipe data
 * @param {Object} data - The validated wipe data
 * @returns {Object} - Business validation result
 */
function validateBusinessRules(data) {
  const errors = [];

  // Check if end time is after start time
  const startTime = new Date(data.startTime);
  const endTime = new Date(data.endTime);
  
  if (endTime <= startTime) {
    errors.push({
      field: 'endTime',
      message: 'End time must be after start time',
      value: data.endTime
    });
  }

  // Check if the wipe duration is reasonable (not too short or too long)
  const durationMs = endTime - startTime;
  const durationMinutes = durationMs / (1000 * 60);
  
  if (durationMinutes < 0.1) { // Less than 6 seconds
    errors.push({
      field: 'duration',
      message: 'Wipe duration seems too short to be valid',
      value: `${durationMinutes.toFixed(2)} minutes`
    });
  }
  
  if (durationMinutes > 10080) { // More than 7 days
    errors.push({
      field: 'duration',
      message: 'Wipe duration seems too long to be valid',
      value: `${durationMinutes.toFixed(2)} minutes`
    });
  }

  // Validate algorithm-specific rules
  if (data.algorithm === 'gutmann' && data.passes !== 35) {
    errors.push({
      field: 'passes',
      message: 'Gutmann algorithm requires exactly 35 passes',
      value: data.passes
    });
  }

  if (data.algorithm === 'dod' && data.passes !== 3) {
    errors.push({
      field: 'passes',
      message: 'DoD 5220.22-M algorithm typically requires 3 passes',
      value: data.passes
    });
  }

  // Check device ID format (should be alphanumeric with possible hyphens/underscores)
  if (!/^[a-zA-Z0-9_-]+$/.test(data.deviceId)) {
    errors.push({
      field: 'deviceId',
      message: 'Device ID should contain only alphanumeric characters, hyphens, and underscores',
      value: data.deviceId
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    data: errors.length === 0 ? data : null
  };
}

/**
 * Validate certificate verification request
 * @param {Object} data - The certificate verification data
 * @returns {Object} - Validation result
 */
function validateCertificateVerification(data) {
  const { error, value } = certificateVerificationSchema.validate(data, { 
    abortEarly: false 
  });

  if (error) {
    return {
      isValid: false,
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context.value
      })),
      data: null
    };
  }

  return {
    isValid: true,
    errors: [],
    data: value
  };
}

/**
 * Validate file upload
 * @param {Object} file - The uploaded file object
 * @returns {Object} - Validation result
 */
function validateFileUpload(file) {
  const { error, value } = fileUploadSchema.validate(file, { 
    abortEarly: false 
  });

  if (error) {
    return {
      isValid: false,
      errors: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context.value
      })),
      data: null
    };
  }

  return {
    isValid: true,
    errors: [],
    data: value
  };
}

/**
 * Sanitize input data by removing potentially harmful content
 * @param {Object} data - The data to sanitize
 * @returns {Object} - Sanitized data
 */
function sanitizeInput(data) {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sanitized = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      // Remove potentially harmful characters and limit length
      sanitized[key] = value
        .replace(/[<>\"'&]/g, '') // Remove HTML/XML characters
        .trim()
        .substring(0, 1000); // Limit string length
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeInput(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

module.exports = {
  validateWipeData,
  validateCertificateVerification,
  validateFileUpload,
  sanitizeInput,
  wipeDataSchema,
  certificateVerificationSchema,
  fileUploadSchema
};
