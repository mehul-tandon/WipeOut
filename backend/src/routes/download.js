const express = require('express');
const path = require('path');
const fs = require('fs');
const { param, query, validationResult } = require('express-validator');

const logger = require('../utils/logger');

const router = express.Router();

// Define available tools and their metadata
const AVAILABLE_TOOLS = {
  windows: {
    filename: 'wipeout-windows.exe',
    displayName: 'WipeOut for Windows',
    version: '1.0.0',
    size: 'NA',
    architecture: 'x64',
    requirements: 'Windows 10 or later',
    description: 'Standalone executable for Windows systems with NIST SP 800-88 compliance'
  },
  linux: {
    filename: 'wipeout-linux',
    displayName: 'WipeOut for Linux',
    version: '1.0.0',
    size: 'NA',
    architecture: 'x64',
    requirements: 'Linux kernel 3.10 or later',
    description: 'Standalone binary for Linux systems with NIST SP 800-88 compliance'
  },
  macos: {
    filename: 'wipeout-macos',
    displayName: 'WipeOut for macOS',
    version: '1.0.0',
    size: 'NA',
    architecture: 'x64/ARM64',
    requirements: 'macOS 10.14 or later',
    description: 'Standalone binary for macOS systems with NIST SP 800-88 compliance'
  }
};

// GET /api/download/tools - List available tools
router.get('/tools', (req, res) => {
  try {
    const toolsDir = path.join(__dirname, '../../../downloads');
    const availableTools = {};

    // Check which tools actually exist
    for (const [platform, toolInfo] of Object.entries(AVAILABLE_TOOLS)) {
      const toolPath = path.join(toolsDir, toolInfo.filename);
      if (fs.existsSync(toolPath)) {
        const stats = fs.statSync(toolPath);
        availableTools[platform] = {
          ...toolInfo,
          actualSize: `${(stats.size / 1024 / 1024).toFixed(1)} MB`,
          lastModified: stats.mtime.toISOString(),
          downloadUrl: `/api/download/tool/${platform}`,
          available: true
        };
      } else {
        availableTools[platform] = {
          ...toolInfo,
          available: false,
          status: 'Not available - tool not built yet'
        };
      }
    }

    logger.info('Tools list requested', {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(200).json({
      success: true,
      data: {
        tools: availableTools,
        totalAvailable: Object.values(availableTools).filter(tool => tool.available).length,
        buildInstructions: 'Run `npm run build:all` to build all platform tools'
      }
    });

  } catch (error) {
    logger.error('Error listing tools', {
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/download/tool/:platform - Download specific tool
router.get('/tool/:platform', [
  param('platform').isIn(['windows', 'linux', 'macos']).withMessage('Invalid platform')
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

    const { platform } = req.params;
    const toolInfo = AVAILABLE_TOOLS[platform];
    
    if (!toolInfo) {
      return res.status(404).json({
        success: false,
        error: 'Platform not supported'
      });
    }

    const toolsDir = path.join(__dirname, '../../../downloads');
    const toolPath = path.join(toolsDir, toolInfo.filename);

    if (!fs.existsSync(toolPath)) {
      return res.status(404).json({
        success: false,
        error: 'Tool not available',
        message: `The ${toolInfo.displayName} has not been built yet. Please run the build process.`
      });
    }

    // Log download
    logger.info('Tool download started', {
      platform,
      filename: toolInfo.filename,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Set appropriate headers
    const contentType = platform === 'android' ? 'application/vnd.android.package-archive' :
                       platform === 'windows' ? 'application/octet-stream' :
                       'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${toolInfo.filename}"`);
    res.setHeader('X-Tool-Version', toolInfo.version);
    res.setHeader('X-Tool-Platform', platform);

    // Stream the file
    const fileStream = fs.createReadStream(toolPath);
    
    fileStream.on('error', (error) => {
      logger.error('File stream error during download', {
        platform,
        filename: toolInfo.filename,
        error: error.message
      });
      
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: 'Download failed'
        });
      }
    });

    fileStream.on('end', () => {
      logger.info('Tool download completed', {
        platform,
        filename: toolInfo.filename,
        ip: req.ip
      });
    });

    fileStream.pipe(res);

  } catch (error) {
    logger.error('Tool download error', {
      platform: req.params.platform,
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/download/detect-os - Detect user's operating system
router.get('/detect-os', (req, res) => {
  try {
    const userAgent = req.get('User-Agent') || '';
    let detectedOS = 'unknown';
    let recommendedTool = null;

    // Simple OS detection based on User-Agent
    if (userAgent.includes('Windows')) {
      detectedOS = 'windows';
      recommendedTool = 'windows';
    } else if (userAgent.includes('Linux')) {
      detectedOS = 'linux';
      recommendedTool = 'linux';
    } else if (userAgent.includes('Mac')) {
      detectedOS = 'macos';
      recommendedTool = 'macos';
    }

    const response = {
      detectedOS,
      recommendedTool,
      userAgent,
      confidence: detectedOS !== 'unknown' ? 'high' : 'low'
    };

    if (recommendedTool && AVAILABLE_TOOLS[recommendedTool]) {
      response.toolInfo = AVAILABLE_TOOLS[recommendedTool];
      response.downloadUrl = `/api/download/tool/${recommendedTool}`;
    }

    logger.info('OS detection performed', {
      detectedOS,
      recommendedTool,
      ip: req.ip,
      userAgent
    });

    res.status(200).json({
      success: true,
      data: response
    });

  } catch (error) {
    logger.error('OS detection error', {
      error: error.message,
      userAgent: req.get('User-Agent')
    });

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// GET /api/download/instructions/:platform - Get platform-specific instructions
router.get('/instructions/:platform', [
  param('platform').isIn(['windows', 'linux', 'macos']).withMessage('Invalid platform')
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

    const { platform } = req.params;
    
    const instructions = {
      windows: {
        title: 'Windows Installation & Usage',
        steps: [
          'Download the secure-wiper-windows.exe file',
          'Right-click the downloaded file and select "Run as administrator"',
          'If Windows Defender shows a warning, click "More info" then "Run anyway"',
          'Follow the on-screen prompts to select the drive to wipe',
          'Choose your preferred wiping algorithm (NIST, DoD, or Gutmann)',
          'Confirm the operation and wait for completion',
          'The tool will automatically generate and submit a wipe report'
        ],
        requirements: [
          'Windows 10 or later',
          'Administrator privileges',
          'At least 100MB free disk space',
          'Internet connection for certificate generation'
        ],
        warnings: [
          'This operation is irreversible',
          'Ensure you have selected the correct drive',
          'Do not interrupt the process once started'
        ]
      },
      linux: {
        title: 'Linux Installation & Usage',
        steps: [
          'Download the secure-wiper-linux binary',
          'Make the file executable: chmod +x secure-wiper-linux',
          'Run with sudo privileges: sudo ./secure-wiper-linux',
          'Select the device to wipe from the list',
          'Choose your preferred wiping algorithm',
          'Confirm the operation and monitor progress',
          'Review the generated certificate upon completion'
        ],
        requirements: [
          'Linux kernel 3.10 or later',
          'Root/sudo privileges',
          'At least 50MB free disk space',
          'Internet connection for certificate generation'
        ],
        warnings: [
          'This operation is irreversible',
          'Unmount the target device before wiping',
          'Ensure no critical data is on the target device'
        ]
      },

      macos: {
        title: 'macOS Installation & Usage',
        steps: [
          'Download the wipeout-macos binary',
          'Open Terminal application',
          'Navigate to the download directory',
          'Make executable: chmod +x wipeout-macos',
          'Run with sudo: sudo ./wipeout-macos',
          'Select the device to wipe from the list',
          'Choose your preferred wiping algorithm',
          'Confirm the operation and monitor progress',
          'Review the generated certificate upon completion'
        ],
        requirements: [
          'macOS 10.14 or later',
          'Administrator privileges',
          'At least 50MB free disk space',
          'Internet connection for certificate generation'
        ],
        warnings: [
          'This operation is irreversible',
          'Unmount the target device before wiping',
          'Ensure no critical data is on the target device'
        ]
      }
    };

    const platformInstructions = instructions[platform];
    
    if (!platformInstructions) {
      return res.status(404).json({
        success: false,
        error: 'Instructions not available for this platform'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        platform,
        ...platformInstructions,
        supportContact: 'support@securedatasolutions.com',
        documentationUrl: '/docs/user-guide'
      }
    });

  } catch (error) {
    logger.error('Instructions retrieval error', {
      platform: req.params.platform,
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router;
