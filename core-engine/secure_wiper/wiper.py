"""
Secure Wiper Core Engine

Implements NIST SP 800-88 compliant data erasure algorithms.
"""

import os
import time
import hashlib
import platform
from datetime import datetime, timezone
from uuid import uuid4
from pathlib import Path

from tqdm import tqdm

from .algorithms.nist import NISTAlgorithm
from .algorithms.dod import DoDAlgorithm
from .algorithms.gutmann import GutmannAlgorithm
from .algorithms.random import RandomAlgorithm
from .utils.device_info import get_device_info
from .utils.verification import verify_wipe


class SecureWiper:
    """Main secure wiping engine."""
    
    ALGORITHMS = {
        'nist': NISTAlgorithm,
        'dod': DoDAlgorithm,
        'gutmann': GutmannAlgorithm,
        'random': RandomAlgorithm,
    }
    
    def __init__(self, logger, config):
        """Initialize the secure wiper.
        
        Args:
            logger: Logger instance
            config: Configuration object
        """
        self.logger = logger
        self.config = config
        self.current_operation = None
        
    def get_algorithm_passes(self, algorithm_name):
        """Get the default number of passes for an algorithm.
        
        Args:
            algorithm_name: Name of the algorithm
            
        Returns:
            int: Default number of passes
        """
        algorithm_class = self.ALGORITHMS.get(algorithm_name)
        if algorithm_class:
            return algorithm_class.DEFAULT_PASSES
        return 1
    
    def wipe_device(self, device_path, algorithm='nist', passes=None, verify=False, device_info=None):
        """Securely wipe a storage device.
        
        Args:
            device_path: Path to the device to wipe
            algorithm: Wiping algorithm to use
            passes: Number of passes (None for algorithm default)
            verify: Whether to verify the wipe
            device_info: Pre-gathered device information
            
        Returns:
            dict: Wipe operation results
        """
        start_time = datetime.now(timezone.utc)
        submission_id = str(uuid4())
        
        # Initialize result structure
        result = {
            'submission_id': submission_id,
            'device_id': device_path,
            'serial_number': 'Unknown',
            'algorithm': algorithm,
            'passes': passes or self.get_algorithm_passes(algorithm),
            'start_time': start_time.isoformat(),
            'end_time': None,
            'duration': None,
            'status': 'failed',
            'verification': verify,
            'errors': [],
            'warnings': [],
            'device_info': device_info or {},
            'environment': self._get_environment_info(),
            'wipe_details': {
                'sectors_wiped': 0,
                'total_sectors': 0,
                'bytes_wiped': 0,
                'total_bytes': 0,
                'error_count': 0,
            }
        }
        
        try:
            self.logger.info(f"Starting wipe operation: {submission_id}")
            self.logger.info(f"Device: {device_path}, Algorithm: {algorithm}, Passes: {result['passes']}")
            
            # Get device information if not provided
            if not device_info:
                device_info = get_device_info(device_path)
                result['device_info'] = device_info
            
            # Extract serial number if available
            if device_info and 'serial' in device_info:
                result['serial_number'] = device_info['serial']
            
            # Get algorithm instance
            algorithm_class = self.ALGORITHMS.get(algorithm)
            if not algorithm_class:
                raise ValueError(f"Unknown algorithm: {algorithm}")
            
            algorithm_instance = algorithm_class(self.logger)
            
            # Open device for writing
            self.logger.info(f"Opening device {device_path} for writing")
            
            # Check if we can open the device
            if not os.path.exists(device_path):
                raise FileNotFoundError(f"Device {device_path} not found")
            
            # Get device size
            device_size = self._get_device_size(device_path)
            result['wipe_details']['total_bytes'] = device_size
            result['wipe_details']['total_sectors'] = device_size // 512  # Assume 512-byte sectors
            
            self.logger.info(f"Device size: {device_size:,} bytes ({device_size / (1024**3):.2f} GB)")
            
            # Perform the wipe
            self.current_operation = {
                'submission_id': submission_id,
                'device_path': device_path,
                'start_time': start_time,
                'status': 'running'
            }
            
            wipe_success = self._perform_wipe(
                device_path=device_path,
                algorithm_instance=algorithm_instance,
                passes=result['passes'],
                device_size=device_size,
                result=result
            )
            
            # Verify wipe if requested
            if verify and wipe_success:
                self.logger.info("Starting wipe verification")
                verification_result = self._verify_wipe(device_path, device_size)
                result['verification_result'] = verification_result
                
                if not verification_result.get('success', False):
                    result['warnings'].append("Wipe verification failed")
                    self.logger.warning("Wipe verification failed")
            
            # Update final status
            end_time = datetime.now(timezone.utc)
            result['end_time'] = end_time.isoformat()
            result['duration'] = str(end_time - start_time)
            
            if wipe_success and result['wipe_details']['error_count'] == 0:
                result['status'] = 'success'
                self.logger.info(f"Wipe operation completed successfully: {submission_id}")
            elif wipe_success and result['wipe_details']['error_count'] > 0:
                result['status'] = 'partial'
                self.logger.warning(f"Wipe operation completed with errors: {submission_id}")
            else:
                result['status'] = 'failed'
                self.logger.error(f"Wipe operation failed: {submission_id}")
            
            return result
            
        except Exception as e:
            self.logger.error(f"Wipe operation failed: {e}")
            result['errors'].append(str(e))
            result['end_time'] = datetime.now(timezone.utc).isoformat()
            result['status'] = 'failed'
            return result
        
        finally:
            self.current_operation = None
    
    def _perform_wipe(self, device_path, algorithm_instance, passes, device_size, result):
        """Perform the actual wiping operation.
        
        Args:
            device_path: Path to the device
            algorithm_instance: Algorithm instance to use
            passes: Number of passes
            device_size: Size of the device in bytes
            result: Result dictionary to update
            
        Returns:
            bool: True if wipe was successful
        """
        try:
            # Calculate buffer size (default 1MB, configurable)
            buffer_size = self.config.get('wipe.buffer_size', 1024 * 1024)
            total_operations = (device_size // buffer_size + 1) * passes
            
            with open(device_path, 'r+b') as device:
                with tqdm(total=total_operations, desc="Wiping", unit="ops") as pbar:
                    
                    for pass_num in range(passes):
                        self.logger.info(f"Starting pass {pass_num + 1}/{passes}")
                        pbar.set_description(f"Pass {pass_num + 1}/{passes}")
                        
                        # Get pattern for this pass
                        pattern = algorithm_instance.get_pattern(pass_num)
                        
                        # Seek to beginning
                        device.seek(0)
                        bytes_written = 0
                        
                        while bytes_written < device_size:
                            # Calculate chunk size
                            remaining = device_size - bytes_written
                            chunk_size = min(buffer_size, remaining)
                            
                            # Create data chunk
                            if isinstance(pattern, bytes):
                                # Fixed pattern
                                chunk = (pattern * (chunk_size // len(pattern) + 1))[:chunk_size]
                            else:
                                # Random pattern
                                chunk = os.urandom(chunk_size)
                            
                            try:
                                # Write chunk
                                written = device.write(chunk)
                                if written != chunk_size:
                                    self.logger.warning(f"Partial write: {written}/{chunk_size} bytes")
                                
                                bytes_written += written
                                result['wipe_details']['bytes_wiped'] = bytes_written
                                result['wipe_details']['sectors_wiped'] = bytes_written // 512
                                
                                pbar.update(1)
                                
                            except IOError as e:
                                self.logger.error(f"Write error at offset {bytes_written}: {e}")
                                result['errors'].append(f"Write error at offset {bytes_written}: {e}")
                                result['wipe_details']['error_count'] += 1
                                
                                # Skip this chunk and continue
                                device.seek(bytes_written + chunk_size)
                                bytes_written += chunk_size
                        
                        # Flush to ensure data is written
                        device.flush()
                        os.fsync(device.fileno())
                        
                        self.logger.info(f"Completed pass {pass_num + 1}/{passes}")
            
            return True
            
        except Exception as e:
            self.logger.error(f"Wipe operation failed: {e}")
            result['errors'].append(f"Wipe operation failed: {e}")
            return False
    
    def _verify_wipe(self, device_path, device_size):
        """Verify that the wipe was successful.
        
        Args:
            device_path: Path to the device
            device_size: Size of the device in bytes
            
        Returns:
            dict: Verification results
        """
        try:
            return verify_wipe(device_path, device_size, self.logger)
        except Exception as e:
            self.logger.error(f"Verification failed: {e}")
            return {
                'success': False,
                'error': str(e),
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
    
    def _get_device_size(self, device_path):
        """Get the size of a device in bytes.
        
        Args:
            device_path: Path to the device
            
        Returns:
            int: Device size in bytes
        """
        try:
            # Try to get size using seek
            with open(device_path, 'rb') as f:
                f.seek(0, 2)  # Seek to end
                return f.tell()
        except Exception:
            # Fallback to stat
            stat = os.stat(device_path)
            return stat.st_size
    
    def _get_environment_info(self):
        """Get environment information.
        
        Returns:
            dict: Environment information
        """
        return {
            'os': platform.system(),
            'os_version': platform.release(),
            'architecture': platform.machine(),
            'hostname': platform.node(),
            'username': os.getenv('USER', os.getenv('USERNAME', 'Unknown')),
            'python_version': platform.python_version(),
            'core_engine_version': '1.0.0'
        }
    
    def get_status(self):
        """Get current operation status.
        
        Returns:
            dict: Current operation status or None
        """
        return self.current_operation
    
    def cancel_operation(self):
        """Cancel the current operation."""
        if self.current_operation:
            self.current_operation['status'] = 'cancelled'
            self.logger.info(f"Cancelling operation: {self.current_operation['submission_id']}")
            # Note: Actual cancellation would require thread coordination
            # This is a simplified implementation
