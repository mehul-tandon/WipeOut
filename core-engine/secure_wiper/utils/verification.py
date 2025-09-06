"""
Wipe Verification Utilities

Functions for verifying that data has been properly wiped.
"""

import os
import hashlib
from datetime import datetime, timezone


def verify_wipe(device_path, device_size, logger, sample_size=1024*1024):
    """Verify that a device has been properly wiped.
    
    Args:
        device_path: Path to the device
        device_size: Size of the device in bytes
        logger: Logger instance
        sample_size: Size of samples to read for verification
        
    Returns:
        dict: Verification results
    """
    result = {
        'success': False,
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'device_path': device_path,
        'device_size': device_size,
        'samples_checked': 0,
        'non_zero_samples': 0,
        'error_count': 0,
        'errors': [],
        'details': {}
    }
    
    try:
        logger.info(f"Starting verification of {device_path}")
        
        # Calculate number of samples to check
        # Check at least 10 samples, but not more than 1000
        num_samples = min(max(device_size // (sample_size * 100), 10), 1000)
        sample_interval = device_size // num_samples if num_samples > 0 else device_size
        
        logger.info(f"Checking {num_samples} samples of {sample_size} bytes each")
        
        with open(device_path, 'rb') as device:
            non_zero_count = 0
            
            for i in range(num_samples):
                try:
                    # Calculate sample position
                    position = i * sample_interval
                    if position + sample_size > device_size:
                        position = device_size - sample_size
                    
                    # Seek to position and read sample
                    device.seek(position)
                    sample_data = device.read(sample_size)
                    
                    if not sample_data:
                        break
                    
                    result['samples_checked'] += 1
                    
                    # Check if sample contains non-zero data
                    if any(byte != 0 for byte in sample_data):
                        non_zero_count += 1
                        
                        # Log details about non-zero data
                        non_zero_positions = [j for j, byte in enumerate(sample_data) if byte != 0]
                        logger.debug(f"Sample {i} at position {position}: {len(non_zero_positions)} non-zero bytes")
                        
                except Exception as e:
                    result['error_count'] += 1
                    result['errors'].append(f"Error reading sample {i} at position {position}: {e}")
                    logger.error(f"Error reading sample {i}: {e}")
            
            result['non_zero_samples'] = non_zero_count
            
            # Calculate success criteria
            # Allow up to 5% of samples to have non-zero data (for bad sectors, etc.)
            max_allowed_non_zero = max(1, result['samples_checked'] * 0.05)
            
            if result['non_zero_samples'] <= max_allowed_non_zero and result['error_count'] == 0:
                result['success'] = True
                logger.info(f"Verification PASSED: {result['non_zero_samples']}/{result['samples_checked']} samples had non-zero data")
            else:
                result['success'] = False
                logger.warning(f"Verification FAILED: {result['non_zero_samples']}/{result['samples_checked']} samples had non-zero data, {result['error_count']} errors")
            
            # Add detailed results
            result['details'] = {
                'sample_size': sample_size,
                'num_samples': num_samples,
                'sample_interval': sample_interval,
                'max_allowed_non_zero': max_allowed_non_zero,
                'non_zero_percentage': (result['non_zero_samples'] / result['samples_checked'] * 100) if result['samples_checked'] > 0 else 0
            }
            
    except Exception as e:
        result['success'] = False
        result['errors'].append(f"Verification failed: {e}")
        logger.error(f"Verification failed: {e}")
    
    return result


def calculate_device_hash(device_path, device_size, logger, chunk_size=1024*1024):
    """Calculate hash of device contents.
    
    Args:
        device_path: Path to the device
        device_size: Size of the device in bytes
        logger: Logger instance
        chunk_size: Size of chunks to read
        
    Returns:
        dict: Hash calculation results
    """
    result = {
        'success': False,
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'device_path': device_path,
        'device_size': device_size,
        'hash_algorithm': 'sha256',
        'hash_value': None,
        'bytes_processed': 0,
        'error_count': 0,
        'errors': []
    }
    
    try:
        logger.info(f"Calculating SHA-256 hash of {device_path}")
        
        hasher = hashlib.sha256()
        bytes_processed = 0
        
        with open(device_path, 'rb') as device:
            while bytes_processed < device_size:
                try:
                    # Calculate chunk size for this iteration
                    remaining = device_size - bytes_processed
                    current_chunk_size = min(chunk_size, remaining)
                    
                    # Read chunk
                    chunk = device.read(current_chunk_size)
                    if not chunk:
                        break
                    
                    # Update hash
                    hasher.update(chunk)
                    bytes_processed += len(chunk)
                    
                    # Log progress periodically
                    if bytes_processed % (chunk_size * 100) == 0:
                        progress = (bytes_processed / device_size) * 100
                        logger.debug(f"Hash calculation progress: {progress:.1f}%")
                        
                except Exception as e:
                    result['error_count'] += 1
                    result['errors'].append(f"Error reading chunk at position {bytes_processed}: {e}")
                    logger.error(f"Error reading chunk: {e}")
                    break
        
        result['bytes_processed'] = bytes_processed
        result['hash_value'] = hasher.hexdigest()
        
        if bytes_processed == device_size and result['error_count'] == 0:
            result['success'] = True
            logger.info(f"Hash calculation completed: {result['hash_value']}")
        else:
            logger.warning(f"Hash calculation incomplete: {bytes_processed}/{device_size} bytes processed, {result['error_count']} errors")
            
    except Exception as e:
        result['errors'].append(f"Hash calculation failed: {e}")
        logger.error(f"Hash calculation failed: {e}")
    
    return result


def verify_pattern_write(device_path, pattern, offset, length, logger):
    """Verify that a specific pattern was written to a device location.
    
    Args:
        device_path: Path to the device
        pattern: Expected pattern (bytes)
        offset: Offset to check
        length: Length to check
        logger: Logger instance
        
    Returns:
        dict: Verification results
    """
    result = {
        'success': False,
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'device_path': device_path,
        'pattern': pattern.hex() if isinstance(pattern, bytes) else str(pattern),
        'offset': offset,
        'length': length,
        'bytes_verified': 0,
        'mismatches': 0,
        'errors': []
    }
    
    try:
        logger.debug(f"Verifying pattern {result['pattern']} at offset {offset}, length {length}")
        
        with open(device_path, 'rb') as device:
            device.seek(offset)
            data = device.read(length)
            
            if len(data) != length:
                result['errors'].append(f"Could only read {len(data)} bytes instead of {length}")
                return result
            
            # Create expected data by repeating pattern
            if isinstance(pattern, bytes):
                expected = (pattern * (length // len(pattern) + 1))[:length]
            else:
                result['errors'].append("Pattern verification only supports bytes patterns")
                return result
            
            # Compare data
            mismatches = 0
            for i in range(length):
                if data[i] != expected[i]:
                    mismatches += 1
            
            result['bytes_verified'] = length
            result['mismatches'] = mismatches
            
            if mismatches == 0:
                result['success'] = True
                logger.debug(f"Pattern verification PASSED: all {length} bytes match")
            else:
                result['success'] = False
                mismatch_percentage = (mismatches / length) * 100
                logger.warning(f"Pattern verification FAILED: {mismatches}/{length} bytes mismatch ({mismatch_percentage:.2f}%)")
                
    except Exception as e:
        result['errors'].append(f"Pattern verification failed: {e}")
        logger.error(f"Pattern verification failed: {e}")
    
    return result
