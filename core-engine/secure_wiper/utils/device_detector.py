"""
Device Detection Utilities

Cross-platform device detection and information gathering.
"""

import os
import platform
import psutil
from pathlib import Path


class DeviceDetector:
    """Cross-platform device detector."""
    
    def __init__(self, logger):
        """Initialize device detector.
        
        Args:
            logger: Logger instance
        """
        self.logger = logger
        self.system = platform.system().lower()
    
    def get_storage_devices(self):
        """Get list of available storage devices.
        
        Returns:
            list: List of device information dictionaries
        """
        devices = []
        
        try:
            if self.system == 'linux':
                devices = self._get_linux_devices()
            elif self.system == 'windows':
                devices = self._get_windows_devices()
            elif self.system == 'darwin':  # macOS
                devices = self._get_macos_devices()
            else:
                self.logger.warning(f"Unsupported platform: {self.system}")
                
        except Exception as e:
            self.logger.error(f"Failed to get storage devices: {e}")
        
        return devices
    
    def _get_linux_devices(self):
        """Get storage devices on Linux."""
        devices = []
        
        # Check /proc/partitions
        try:
            with open('/proc/partitions', 'r') as f:
                lines = f.readlines()[2:]  # Skip header
                
            for line in lines:
                parts = line.strip().split()
                if len(parts) >= 4:
                    device_name = parts[3]
                    if device_name.startswith(('sd', 'hd', 'nvme', 'mmcblk')):
                        device_path = f'/dev/{device_name}'
                        device_info = self.get_device_info(device_path)
                        if device_info:
                            devices.append(device_info)
                            
        except Exception as e:
            self.logger.error(f"Failed to read /proc/partitions: {e}")
        
        return devices
    
    def _get_windows_devices(self):
        """Get storage devices on Windows."""
        devices = []
        
        try:
            # Use psutil to get disk partitions
            partitions = psutil.disk_partitions()
            
            for partition in partitions:
                if partition.fstype:  # Only include mounted filesystems
                    device_info = self.get_device_info(partition.device)
                    if device_info:
                        devices.append(device_info)
                        
        except Exception as e:
            self.logger.error(f"Failed to get Windows devices: {e}")
        
        return devices
    
    def _get_macos_devices(self):
        """Get storage devices on macOS."""
        devices = []
        
        try:
            # Use diskutil list to get devices
            import subprocess
            result = subprocess.run(['diskutil', 'list'], 
                                  capture_output=True, text=True)
            
            if result.returncode == 0:
                lines = result.stdout.split('\n')
                for line in lines:
                    if '/dev/disk' in line:
                        device_path = line.split()[0]
                        device_info = self.get_device_info(device_path)
                        if device_info:
                            devices.append(device_info)
                            
        except Exception as e:
            self.logger.error(f"Failed to get macOS devices: {e}")
        
        return devices
    
    def get_device_info(self, device_path):
        """Get detailed information about a device.
        
        Args:
            device_path: Path to the device
            
        Returns:
            dict: Device information or None if failed
        """
        try:
            device_info = {
                'path': device_path,
                'name': os.path.basename(device_path),
                'type': 'unknown',
                'size_bytes': 0,
                'size_human': '0 B',
                'writable': False,
                'mount_points': [],
                'status': 'unknown'
            }
            
            # Check if device exists
            if not os.path.exists(device_path):
                return None
            
            # Get device size
            try:
                stat = os.stat(device_path)
                device_info['size_bytes'] = stat.st_size
                device_info['size_human'] = self._format_bytes(stat.st_size)
            except Exception:
                pass
            
            # Check if writable
            try:
                device_info['writable'] = os.access(device_path, os.W_OK)
            except Exception:
                pass
            
            # Get mount points
            try:
                partitions = psutil.disk_partitions()
                for partition in partitions:
                    if partition.device == device_path:
                        device_info['mount_points'].append(partition.mountpoint)
            except Exception:
                pass
            
            # Determine device type
            device_info['type'] = self._get_device_type(device_path)
            
            # Set status
            if device_info['writable']:
                device_info['status'] = 'ready'
            elif device_info['mount_points']:
                device_info['status'] = 'mounted'
            else:
                device_info['status'] = 'read-only'
            
            return device_info
            
        except Exception as e:
            self.logger.error(f"Failed to get device info for {device_path}: {e}")
            return None
    
    def _get_device_type(self, device_path):
        """Determine device type based on path.
        
        Args:
            device_path: Path to the device
            
        Returns:
            str: Device type
        """
        device_name = os.path.basename(device_path).lower()
        
        if 'nvme' in device_name:
            return 'NVMe SSD'
        elif device_name.startswith('sd'):
            return 'SATA/SCSI'
        elif device_name.startswith('hd'):
            return 'IDE/PATA'
        elif 'mmc' in device_name:
            return 'MMC/SD Card'
        elif device_name.startswith('loop'):
            return 'Loop Device'
        elif device_name.startswith('dm-'):
            return 'Device Mapper'
        else:
            return 'Storage Device'
    
    def _format_bytes(self, bytes_value):
        """Format bytes as human-readable string.
        
        Args:
            bytes_value: Number of bytes
            
        Returns:
            str: Formatted string
        """
        for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
            if bytes_value < 1024.0:
                return f"{bytes_value:.1f} {unit}"
            bytes_value /= 1024.0
        return f"{bytes_value:.1f} PB"
