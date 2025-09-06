"""
Configuration Management

Handles configuration loading and management for the secure wiper.
"""

import os
import yaml
from pathlib import Path
from typing import Any, Dict, Optional


class Config:
    """Configuration manager for secure wiper."""
    
    DEFAULT_CONFIG = {
        'api': {
            'enabled': True,
            'base_url': 'http://localhost:3001',
            'timeout': 30,
            'retry_attempts': 3,
            'retry_delay': 1.0,
        },
        'wipe': {
            'buffer_size': 1024 * 1024,  # 1MB
            'verify_after_wipe': False,
            'default_algorithm': 'nist',
            'allow_mounted_devices': False,
            'require_confirmation': True,
        },
        'logging': {
            'level': 'INFO',
            'file': None,
            'console': True,
            'max_file_size': 10 * 1024 * 1024,  # 10MB
            'backup_count': 5,
        },
        'security': {
            'require_admin': True,
            'check_device_permissions': True,
            'validate_device_path': True,
        },
        'output': {
            'report_format': 'json',
            'report_directory': './reports',
            'include_device_info': True,
            'include_environment_info': True,
        }
    }
    
    def __init__(self, config_file=None):
        """Initialize configuration.
        
        Args:
            config_file: Path to configuration file (optional)
        """
        self.config = self.DEFAULT_CONFIG.copy()
        self.config_file = config_file
        
        # Load configuration from file if provided
        if config_file:
            self.load_from_file(config_file)
        
        # Load configuration from environment variables
        self.load_from_environment()
    
    def load_from_file(self, config_file):
        """Load configuration from YAML file.
        
        Args:
            config_file: Path to configuration file
        """
        config_path = Path(config_file)
        
        if not config_path.exists():
            raise FileNotFoundError(f"Configuration file not found: {config_file}")
        
        try:
            with open(config_path, 'r') as f:
                file_config = yaml.safe_load(f)
            
            if file_config:
                self._merge_config(self.config, file_config)
                
        except yaml.YAMLError as e:
            raise ValueError(f"Invalid YAML in configuration file: {e}")
        except Exception as e:
            raise ValueError(f"Error loading configuration file: {e}")
    
    def load_from_environment(self):
        """Load configuration from environment variables."""
        env_mappings = {
            'SECURE_WIPER_API_URL': ('api', 'base_url'),
            'SECURE_WIPER_API_ENABLED': ('api', 'enabled'),
            'SECURE_WIPER_API_TIMEOUT': ('api', 'timeout'),
            'SECURE_WIPER_BUFFER_SIZE': ('wipe', 'buffer_size'),
            'SECURE_WIPER_DEFAULT_ALGORITHM': ('wipe', 'default_algorithm'),
            'SECURE_WIPER_LOG_LEVEL': ('logging', 'level'),
            'SECURE_WIPER_LOG_FILE': ('logging', 'file'),
            'SECURE_WIPER_REQUIRE_ADMIN': ('security', 'require_admin'),
            'SECURE_WIPER_REPORT_DIR': ('output', 'report_directory'),
        }
        
        for env_var, (section, key) in env_mappings.items():
            value = os.getenv(env_var)
            if value is not None:
                # Convert string values to appropriate types
                converted_value = self._convert_env_value(value)
                self.config[section][key] = converted_value
    
    def _convert_env_value(self, value):
        """Convert environment variable string to appropriate type.
        
        Args:
            value: String value from environment
            
        Returns:
            Converted value
        """
        # Boolean conversion
        if value.lower() in ('true', 'yes', '1', 'on'):
            return True
        elif value.lower() in ('false', 'no', '0', 'off'):
            return False
        
        # Integer conversion
        try:
            return int(value)
        except ValueError:
            pass
        
        # Float conversion
        try:
            return float(value)
        except ValueError:
            pass
        
        # Return as string
        return value
    
    def _merge_config(self, base_config, new_config):
        """Recursively merge configuration dictionaries.
        
        Args:
            base_config: Base configuration dictionary
            new_config: New configuration to merge
        """
        for key, value in new_config.items():
            if key in base_config and isinstance(base_config[key], dict) and isinstance(value, dict):
                self._merge_config(base_config[key], value)
            else:
                base_config[key] = value
    
    def get(self, key, default=None):
        """Get configuration value using dot notation.
        
        Args:
            key: Configuration key (e.g., 'api.base_url')
            default: Default value if key not found
            
        Returns:
            Configuration value
        """
        keys = key.split('.')
        value = self.config
        
        try:
            for k in keys:
                value = value[k]
            return value
        except (KeyError, TypeError):
            return default
    
    def set(self, key, value):
        """Set configuration value using dot notation.
        
        Args:
            key: Configuration key (e.g., 'api.base_url')
            value: Value to set
        """
        keys = key.split('.')
        config = self.config
        
        # Navigate to the parent dictionary
        for k in keys[:-1]:
            if k not in config:
                config[k] = {}
            config = config[k]
        
        # Set the value
        config[keys[-1]] = value
    
    def get_section(self, section):
        """Get entire configuration section.
        
        Args:
            section: Section name
            
        Returns:
            dict: Configuration section
        """
        return self.config.get(section, {})
    
    def validate(self):
        """Validate configuration values.
        
        Raises:
            ValueError: If configuration is invalid
        """
        # Validate API configuration
        api_config = self.get_section('api')
        if api_config.get('enabled') and not api_config.get('base_url'):
            raise ValueError("API base URL is required when API is enabled")
        
        # Validate wipe configuration
        wipe_config = self.get_section('wipe')
        buffer_size = wipe_config.get('buffer_size', 0)
        if buffer_size <= 0 or buffer_size > 100 * 1024 * 1024:  # Max 100MB
            raise ValueError("Buffer size must be between 1 byte and 100MB")
        
        # Validate logging configuration
        logging_config = self.get_section('logging')
        valid_levels = ['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']
        if logging_config.get('level', '').upper() not in valid_levels:
            raise ValueError(f"Invalid log level. Must be one of: {', '.join(valid_levels)}")
    
    def save_to_file(self, config_file=None):
        """Save current configuration to file.
        
        Args:
            config_file: Path to save configuration (uses loaded file if None)
        """
        output_file = config_file or self.config_file
        if not output_file:
            raise ValueError("No configuration file specified")
        
        config_path = Path(output_file)
        config_path.parent.mkdir(parents=True, exist_ok=True)
        
        with open(config_path, 'w') as f:
            yaml.dump(self.config, f, default_flow_style=False, indent=2)
    
    def to_dict(self):
        """Get configuration as dictionary.
        
        Returns:
            dict: Complete configuration
        """
        return self.config.copy()
    
    def __str__(self):
        """String representation of configuration."""
        return yaml.dump(self.config, default_flow_style=False, indent=2)
