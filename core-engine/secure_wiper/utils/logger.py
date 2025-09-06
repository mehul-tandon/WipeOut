"""
Logging Utilities

Provides centralized logging configuration for the secure wiper.
"""

import logging
import sys
from pathlib import Path
from datetime import datetime


def setup_logger(level='INFO', log_file=None, console=True):
    """Setup logging configuration.
    
    Args:
        level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        log_file: Path to log file (None for no file logging)
        console: Whether to log to console
        
    Returns:
        logging.Logger: Configured logger instance
    """
    logger = logging.getLogger('secure_wiper')
    logger.setLevel(getattr(logging, level.upper()))
    
    # Clear existing handlers
    logger.handlers.clear()
    
    # Create formatter
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # Console handler
    if console:
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(getattr(logging, level.upper()))
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)
    
    # File handler
    if log_file:
        log_path = Path(log_file)
        log_path.parent.mkdir(parents=True, exist_ok=True)
        
        file_handler = logging.FileHandler(log_path)
        file_handler.setLevel(logging.DEBUG)  # Always log everything to file
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
    
    return logger


class WipeLogger:
    """Specialized logger for wipe operations."""
    
    def __init__(self, logger, submission_id):
        """Initialize the wipe logger.
        
        Args:
            logger: Base logger instance
            submission_id: Unique submission ID for this operation
        """
        self.logger = logger
        self.submission_id = submission_id
        self.start_time = datetime.now()
    
    def info(self, message):
        """Log info message with submission ID."""
        self.logger.info(f"[{self.submission_id}] {message}")
    
    def debug(self, message):
        """Log debug message with submission ID."""
        self.logger.debug(f"[{self.submission_id}] {message}")
    
    def warning(self, message):
        """Log warning message with submission ID."""
        self.logger.warning(f"[{self.submission_id}] {message}")
    
    def error(self, message):
        """Log error message with submission ID."""
        self.logger.error(f"[{self.submission_id}] {message}")
    
    def critical(self, message):
        """Log critical message with submission ID."""
        self.logger.critical(f"[{self.submission_id}] {message}")
    
    def log_operation_start(self, device_path, algorithm, passes):
        """Log the start of a wipe operation."""
        self.info(f"Starting wipe operation")
        self.info(f"Device: {device_path}")
        self.info(f"Algorithm: {algorithm}")
        self.info(f"Passes: {passes}")
        self.info(f"Start time: {self.start_time}")
    
    def log_operation_end(self, status, duration=None):
        """Log the end of a wipe operation."""
        end_time = datetime.now()
        actual_duration = duration or (end_time - self.start_time)
        
        self.info(f"Wipe operation completed")
        self.info(f"Status: {status}")
        self.info(f"Duration: {actual_duration}")
        self.info(f"End time: {end_time}")
    
    def log_pass_start(self, pass_number, total_passes, pattern_description):
        """Log the start of a wipe pass."""
        self.info(f"Starting pass {pass_number + 1}/{total_passes}: {pattern_description}")
    
    def log_pass_end(self, pass_number, bytes_written, errors=0):
        """Log the end of a wipe pass."""
        self.info(f"Completed pass {pass_number + 1}: {bytes_written:,} bytes written, {errors} errors")
    
    def log_verification_start(self):
        """Log the start of verification."""
        self.info("Starting wipe verification")
    
    def log_verification_end(self, success, details=None):
        """Log the end of verification."""
        status = "PASSED" if success else "FAILED"
        self.info(f"Verification {status}")
        if details:
            self.info(f"Verification details: {details}")
    
    def log_error_recovery(self, error, action):
        """Log error recovery actions."""
        self.warning(f"Error encountered: {error}")
        self.warning(f"Recovery action: {action}")
    
    def log_progress(self, bytes_written, total_bytes, pass_number=None):
        """Log progress information."""
        percentage = (bytes_written / total_bytes) * 100 if total_bytes > 0 else 0
        pass_info = f" (pass {pass_number + 1})" if pass_number is not None else ""
        self.debug(f"Progress{pass_info}: {bytes_written:,}/{total_bytes:,} bytes ({percentage:.1f}%)")


def get_operation_logger(base_logger, submission_id):
    """Get a specialized logger for a wipe operation.
    
    Args:
        base_logger: Base logger instance
        submission_id: Unique submission ID
        
    Returns:
        WipeLogger: Specialized wipe logger
    """
    return WipeLogger(base_logger, submission_id)
