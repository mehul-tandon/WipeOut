"""
Device Information Utilities

Functions for gathering detailed device information.
"""

import os
import platform
import subprocess
from pathlib import Path


def get_device_info(device_path):
    """Get comprehensive device information.
    
    Args:
        device_path: Path to the device
        
    Returns:
        dict: Device information
    """
    system = platform.system().lower()
    
    if system == 'linux':
        return _get_linux_device_info(device_path)
    elif system == 'windows':
        return _get_windows_device_info(device_path)
    elif system == 'darwin':
        return _get_macos_device_info(device_path)
    else:
        return _get_generic_device_info(device_path)


def _get_linux_device_info(device_path):
    """Get device information on Linux."""
    info = _get_generic_device_info(device_path)
    
    try:
        # Try to get additional info from udevadm
        result = subprocess.run(
            ['udevadm', 'info', '--query=all', '--name=' + device_path],
            capture_output=True, text=True, timeout=10
        )
        
        if result.returncode == 0:
            for line in result.stdout.split('\n'):
                if 'ID_SERIAL=' in line:
                    info['serial'] = line.split('=', 1)[1].strip()
                elif 'ID_MODEL=' in line:
                    info['model'] = line.split('=', 1)[1].strip()
                elif 'ID_VENDOR=' in line:
                    info['vendor'] = line.split('=', 1)[1].strip()
                elif 'ID_BUS=' in line:
                    info['interface'] = line.split('=', 1)[1].strip()
                    
    except Exception:
        pass
    
    try:
        # Try to get info from /sys/block
        device_name = os.path.basename(device_path)
        sys_path = f'/sys/block/{device_name}'
        
        if os.path.exists(sys_path):
            # Read model
            model_file = os.path.join(sys_path, 'device', 'model')
            if os.path.exists(model_file):
                with open(model_file, 'r') as f:
                    info['model'] = f.read().strip()
            
            # Read vendor
            vendor_file = os.path.join(sys_path, 'device', 'vendor')
            if os.path.exists(vendor_file):
                with open(vendor_file, 'r') as f:
                    info['vendor'] = f.read().strip()
                    
    except Exception:
        pass
    
    return info


def _get_windows_device_info(device_path):
    """Get device information on Windows."""
    info = _get_generic_device_info(device_path)
    
    try:
        # Use wmic to get disk information
        result = subprocess.run(
            ['wmic', 'diskdrive', 'get', 'Model,SerialNumber,Size,InterfaceType', '/format:csv'],
            capture_output=True, text=True, timeout=10
        )
        
        if result.returncode == 0:
            lines = result.stdout.strip().split('\n')[1:]  # Skip header
            for line in lines:
                if line.strip():
                    parts = line.split(',')
                    if len(parts) >= 5:
                        info['interface'] = parts[1]
                        info['model'] = parts[2]
                        info['serial'] = parts[3]
                        # Size is in bytes
                        try:
                            info['capacity'] = int(parts[4])
                        except (ValueError, IndexError):
                            pass
                        break
                        
    except Exception:
        pass
    
    return info


def _get_macos_device_info(device_path):
    """Get device information on macOS."""
    info = _get_generic_device_info(device_path)
    
    try:
        # Use diskutil info to get device information
        result = subprocess.run(
            ['diskutil', 'info', device_path],
            capture_output=True, text=True, timeout=10
        )
        
        if result.returncode == 0:
            for line in result.stdout.split('\n'):
                line = line.strip()
                if line.startswith('Device / Media Name:'):
                    info['model'] = line.split(':', 1)[1].strip()
                elif line.startswith('Disk Size:'):
                    # Parse size information
                    size_info = line.split(':', 1)[1].strip()
                    if '(' in size_info:
                        size_bytes = size_info.split('(')[1].split()[0]
                        try:
                            info['capacity'] = int(size_bytes)
                        except ValueError:
                            pass
                elif line.startswith('Protocol:'):
                    info['interface'] = line.split(':', 1)[1].strip()
                    
    except Exception:
        pass
    
    return info


def _get_generic_device_info(device_path):
    """Get basic device information (cross-platform)."""
    info = {
        'path': device_path,
        'name': os.path.basename(device_path),
        'exists': os.path.exists(device_path),
        'readable': False,
        'writable': False,
        'size': 0,
        'model': 'Unknown',
        'vendor': 'Unknown',
        'serial': 'Unknown',
        'interface': 'Unknown',
        'capacity': 0,
    }
    
    if not info['exists']:
        return info
    
    try:
        # Check permissions
        info['readable'] = os.access(device_path, os.R_OK)
        info['writable'] = os.access(device_path, os.W_OK)
        
        # Get size
        stat = os.stat(device_path)
        info['size'] = stat.st_size
        info['capacity'] = stat.st_size
        
    except Exception:
        pass
    
    return info
